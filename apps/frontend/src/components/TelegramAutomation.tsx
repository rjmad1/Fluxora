"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TelegramDraft {
  id: string;
  user: string;
  avatar: string;
  type: "text" | "image" | "gallery";
  content: string;
  imageUrl?: string;
  timestamp: string;
}

interface TelegramCommand {
  command: string;
  action: string;
  active: boolean;
}

interface TelegramUser {
  id: string;
  handle: string;
  role: "Owner" | "Editor" | "Observer" | "Blocked";
  joinedAt: string;
}

interface TelegramAutomationProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function TelegramAutomation({ onNotify }: TelegramAutomationProps) {
  // Chatbot Initialization State
  const [botActive, setBotActive] = useState(false);
  const [botUsername, setBotUsername] = useState("@FluxoraControlBot");
  const [pollingRate, setPollingRate] = useState("1.5s");

  // Commands Mapping
  const [commands, setCommands] = useState<TelegramCommand[]>([
    { command: "/status", action: "Show active publishing scheduler workflows", active: true },
    { command: "/drafts", action: "List media assets waiting inside staging queue", active: true },
    { command: "/publish", action: "Approve and publish a staged asset directly", active: true },
    { command: "/workspace", action: "Switch active brand or workspace context", active: false },
  ]);
  const [newCommand, setNewCommand] = useState("");
  const [newAction, setNewAction] = useState("");

  // Staging queue mock
  const [draftQueue, setDraftQueue] = useState<TelegramDraft[]>([
    { id: "dg-1", user: "dev_lead_alex", avatar: "AL", type: "image", content: "Ingesting ClickHouse telemetry charts visual breakdown mock.", imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80", timestamp: "10 mins ago" },
    { id: "dg-2", user: "writer_sarah", avatar: "SA", type: "text", content: "🚀 Decoupling PostgreSQL from analytics events guarantees sub-second aggregations! Stream via Kafka today.", timestamp: "25 mins ago" },
  ]);

  // Authorized Users List
  const [telegramUsers, setTelegramUsers] = useState<TelegramUser[]>([
    { id: "tu-1", handle: "@alex_architect", role: "Owner", joinedAt: "2026-05-12" },
    { id: "tu-2", handle: "@sarah_editor", role: "Editor", joinedAt: "2026-06-01" },
    { id: "tu-3", handle: "@guest_observer", role: "Observer", joinedAt: "2026-06-14" },
  ]);

  // Automated Alert Options
  const [alerts, setAlerts] = useState({
    successGroup: "1098274192", // Chat Group ID
    failGroup: "1098274192",
    successEnabled: true,
    failEnabled: true,
  });

  const handleToggleBot = () => {
    const nextState = !botActive;
    setBotActive(nextState);
    onNotify(`Telegram bot pooling service ${nextState ? "started" : "halted"}`, nextState ? "AUDIT" : "WARN");
  };

  const handleAddCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommand || !newAction) return;

    setCommands(prev => [
      ...prev,
      { command: newCommand.startsWith("/") ? newCommand : `/${newCommand}`, action: newAction, active: true }
    ]);
    setNewCommand("");
    setNewAction("");
    onNotify(`Added bot command mapping: ${newCommand}`, "INFO");
  };

  const toggleCommandActive = (cmdName: string) => {
    setCommands(prev => prev.map(c => {
      if (c.command === cmdName) {
        return { ...c, active: !c.active };
      }
      return c;
    }));
  };

  const handleApproveDraft = (id: string, content: string) => {
    setDraftQueue(prev => prev.filter(d => d.id !== id));
    onNotify(`Telegram Draft Approved & sent to OmniComposer: "${content.slice(0, 30)}..."`, "AUDIT");
    alert(`Draft approved! Content successfully pushed into active workspace staging vault.`);
  };

  const handleRejectDraft = (id: string) => {
    setDraftQueue(prev => prev.filter(d => d.id !== id));
    onNotify("Telegram Draft Rejected and purged", "WARN");
  };

  const handleUserRoleChange = (id: string, newRole: any) => {
    setTelegramUsers(prev => prev.map(u => {
      if (u.id === id) {
        onNotify(`Updated role for ${u.handle} to ${newRole}`, "WARN");
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Bot Initializer Settings Header */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center justify-center text-[#229ED9]">
              <Icons.Send className="w-5 h-5 rotate-45 mr-0.5 mt-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">OpenClaw Telegram Gateway</h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Control workspaces and stage social media assets via remote Telegram chat clients.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-[#A1A1AA] font-mono block">Bot Handlers: <span className="text-white font-bold">{botUsername}</span></span>
              <span className="text-[10px] text-[#A1A1AA] font-mono block">Polling Rate: <span className="text-white font-bold">{pollingRate}</span></span>
            </div>

            <button
              onClick={handleToggleBot}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5 ${
                botActive
                  ? "bg-red-500 hover:bg-red-650 text-white"
                  : "bg-[#229ED9] hover:bg-[#229ED9]/80 text-white"
              }`}
            >
              {botActive ? (
                <>
                  <Icons.Pause className="w-4 h-4" />
                  <span>Stop Bot Polling</span>
                </>
              ) : (
                <>
                  <Icons.Play className="w-4 h-4" />
                  <span>Initialize Chatbot</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Polling Animation Indicator */}
        {botActive && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Active bot connection pooling. Listening for text commands...
            </span>
            <span className="text-[9px] text-emerald-400 font-mono font-bold">UPTIME: 100.0%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mock Telegram Chat Staging Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Icons.Layers className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <span>Staging Asset Queue (Received via Bot)</span>
          </h4>

          <div className="space-y-3">
            {draftQueue.map(draft => (
              <div key={draft.id} className="bg-[#121218] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                {/* Header info */}
                <div className="px-4.5 py-3 border-b border-white/[0.04] bg-[#0B0B0F]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[10px] font-bold text-white">
                      {draft.avatar}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{draft.user}</span>
                      <span className="text-[9px] text-[#A1A1AA] ml-2">• Telegram client</span>
                    </div>
                  </div>

                  <span className="text-[9px] text-[#A1A1AA] font-mono">{draft.timestamp}</span>
                </div>

                {/* Staged Message body */}
                <div className="p-4.5 space-y-3.5">
                  {draft.imageUrl && (
                    <div className="h-40 rounded-xl overflow-hidden border border-white/[0.08] max-w-md relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.imageUrl}
                        alt="Staged attachment"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-xs text-white leading-relaxed">{draft.content}</p>

                  <div className="flex justify-end gap-2.5 border-t border-white/[0.04] pt-3.5">
                    <button
                      onClick={() => handleRejectDraft(draft.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Purge Draft
                    </button>
                    <button
                      onClick={() => handleApproveDraft(draft.id, draft.content)}
                      className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                      <Icons.CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve to Stage</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {draftQueue.length === 0 && (
              <div className="bg-[#121218]/50 border border-white/[0.08] border-dashed rounded-2xl p-6 text-center text-xs text-[#A1A1AA] py-12">
                💡 Staging queue empty. Send messages or assets to bot to review drafts here!
              </div>
            )}
          </div>
        </div>

        {/* Configuration settings sidebar */}
        <div className="space-y-6">
          {/* Notification Alerts */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Icons.Bell className="w-4 h-4 text-[#8B5CF6]" />
              <span>Automated Status Alerts</span>
            </h4>

            <div className="space-y-3.5">
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-white font-medium">Alert on publish success</span>
                  <input
                    type="checkbox"
                    checked={alerts.successEnabled}
                    onChange={() => setAlerts(prev => ({ ...prev, successEnabled: !prev.successEnabled }))}
                    className="rounded text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 bg-slate-900 border-white/[0.08]"
                  />
                </label>
                {alerts.successEnabled && (
                  <input
                    type="text"
                    placeholder="Telegram Chat ID..."
                    value={alerts.successGroup}
                    onChange={e => setAlerts(prev => ({ ...prev, successGroup: e.target.value }))}
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-[10px] text-white p-2 rounded focus:outline-none font-mono"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-white font-medium">Alert on workflow error</span>
                  <input
                    type="checkbox"
                    checked={alerts.failEnabled}
                    onChange={() => setAlerts(prev => ({ ...prev, failEnabled: !prev.failEnabled }))}
                    className="rounded text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 bg-slate-900 border-white/[0.08]"
                  />
                </label>
                {alerts.failEnabled && (
                  <input
                    type="text"
                    placeholder="Telegram Chat ID..."
                    value={alerts.failGroup}
                    onChange={e => setAlerts(prev => ({ ...prev, failGroup: e.target.value }))}
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-[10px] text-white p-2 rounded focus:outline-none font-mono"
                  />
                )}
              </div>
            </div>
          </div>

          {/* User Permission Management */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Icons.ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
              <span>Group Permission Matrix</span>
            </h4>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {telegramUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2.5 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-lg text-xs font-mono">
                  <div className="min-w-0 pr-2">
                    <span className="text-white font-bold block truncate">{u.handle}</span>
                    <span className="text-[8px] text-[#A1A1AA]/60 font-semibold uppercase">{u.joinedAt}</span>
                  </div>

                  <select
                    value={u.role}
                    onChange={e => handleUserRoleChange(u.id, e.target.value as any)}
                    className="bg-[#121218] border border-white/[0.08] text-[10px] text-white p-1.5 rounded cursor-pointer focus:outline-none"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Editor">Editor</option>
                    <option value="Observer">Observer</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bot Slash command parser setup */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icons.Code2 className="w-4.5 h-4.5 text-[#8B5CF6]" />
          <span>Telegram Text Command Parser settings</span>
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2.5">
            {commands.map(cmd => (
              <div key={cmd.command} className="flex items-center justify-between p-3 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-[#8B5CF6] font-bold">{cmd.command}</span>
                  <span className="text-[#A1A1AA] font-sans text-[11px]">— {cmd.action}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={cmd.active}
                    onChange={() => toggleCommandActive(cmd.command)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#A1A1AA] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7C3AED] peer-checked:after:bg-white" />
                </label>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddCommand} className="bg-[#0B0B0F]/50 border border-white/[0.06] p-4.5 rounded-xl space-y-3 h-fit">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">Register parser Command</span>
            <input
              type="text"
              required
              placeholder="/status"
              value={newCommand}
              onChange={e => setNewCommand(e.target.value)}
              className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none font-mono"
            />
            <input
              type="text"
              required
              placeholder="Action explanation..."
              value={newAction}
              onChange={e => setNewAction(e.target.value)}
              className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold py-2 rounded-lg transition"
            >
              Add Command Parser
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
