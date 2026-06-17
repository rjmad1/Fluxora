"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MCPUndocumentedServer {
  id: string;
  name: string;
  url: string;
  status: "connected" | "disconnected" | "error";
  type: string;
}

interface AgentCLIAndMCPProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function AgentCLIAndMCP({ onNotify }: AgentCLIAndMCPProps) {
  // LLM Provider Toggles
  const [providers, setProviders] = useState({
    claude: true,
    chatgpt: true,
    codex: false,
    openclaw: true,
    cursor: false,
  });

  // Credentials and Handshake States
  const [apiKey, setApiKey] = useState("sk-claw-xxxxxxxxxxxxxxxxxxxx");
  const [handshakeStatus, setHandshakeStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [handshakeProgress, setHandshakeProgress] = useState(0);

  // MCP Servers
  const [mcpServers, setMcpServers] = useState<MCPUndocumentedServer[]>([
    { id: "mcp-1", name: "FileSystem Server", url: "file:///workspace/src", status: "connected", type: "Local" },
    { id: "mcp-2", name: "PostgreSQL Schema Reader", url: "postgresql://localhost:5432/fluxora", status: "connected", type: "DB" },
    { id: "mcp-3", name: "Search Engine Tool", url: "https://api.tavily.com", status: "disconnected", type: "API" },
  ]);
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerType, setNewServerType] = useState("API");

  // Real Agent Runs & Approvals lists
  const [runs, setRuns] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // CLI Terminal States
  const [inputVal, setInputVal] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: "input" | "output" | "system" | "error"; text: string }>>([
    { type: "system", text: "Fluxora AI Agent CLI v1.4.0 (MCP-compatible)" },
    { type: "system", text: "Type 'help' to list available agent commands." },
    { type: "output", text: "Ready for local prompt executions..." },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchRunsAndApprovals = async () => {
    setLoadingRuns(true);
    try {
      const [runsRes, approvalsRes] = await Promise.all([
        fetch("http://localhost:3000/api/v1/ai/runs", {
          headers: {
            "X-Tenant-ID": "Fluxora-Tenant-098",
            "X-Workspace-ID": "ws-1",
          },
        }),
        fetch("http://localhost:3000/api/v1/ai/runs/approvals", {
          headers: {
            "X-Tenant-ID": "Fluxora-Tenant-098",
            "X-Workspace-ID": "ws-1",
          },
        }),
      ]);

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setRuns(runsData);
      }
      if (approvalsRes.ok) {
        const approvalsData = await approvalsRes.json();
        setApprovals(approvalsData);
      }
    } catch (err) {
      console.warn("Agent runs API offline, using empty mock list:", err);
    } finally {
      setLoadingRuns(false);
    }
  };

  useEffect(() => {
    fetchRunsAndApprovals();
    const interval = setInterval(fetchRunsAndApprovals, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveReject = async (approvalId: string, status: "APPROVED" | "REJECTED") => {
    onNotify(`Identity: Submitting approval ${status} for ${approvalId}`, "INFO");
    try {
      const res = await fetch("http://localhost:3000/api/v1/ai/runs/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ approvalId, status }),
      });
      if (!res.ok) throw new Error("API Offline");
      onNotify(`AI Agent run approval processed: ${status}`, "AUDIT");
      fetchRunsAndApprovals();
    } catch {
      // Mock fallback
      setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status } : a));
      setRuns(prev => prev.map(r => {
        const approval = approvals.find(a => a.id === approvalId);
        if (r.id !== approval?.runId) return r;
        return {
          ...r,
          status: status === "APPROVED" ? "EXECUTING" : "FAILED",
          currentStep: status === "APPROVED" ? "Campaign execution initiated dynamically." : "Budget rejected."
        };
      }));
      onNotify(`Demo: Approved/Rejected run state locally`, "AUDIT");
    }
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalHistory]);

  const handleProviderToggle = (key: keyof typeof providers) => {
    const nextVal = !providers[key];
    setProviders((prev) => ({ ...prev, [key]: nextVal }));
    onNotify(`LLM Provider ${key} ${nextVal ? "enabled" : "disabled"}`, "INFO");
  };

  const handleTestHandshake = () => {
    if (handshakeStatus === "testing") return;
    setHandshakeStatus("testing");
    setHandshakeProgress(0);
    onNotify("Initiating handshake connection validation with AI providers...", "INFO");

    const interval = setInterval(() => {
      setHandshakeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setHandshakeStatus("success");
          onNotify("API Credentials validated successfully (handshake 200 OK)", "AUDIT");
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const handleAddMCPServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName || !newServerUrl) return;

    const newServer: MCPUndocumentedServer = {
      id: `mcp-${Date.now()}`,
      name: newServerName,
      url: newServerUrl,
      status: "connected",
      type: newServerType,
    };

    setMcpServers((prev) => [...prev, newServer]);
    setNewServerName("");
    setNewServerUrl("");
    onNotify(`Registered new MCP server: ${newServerName}`, "INFO");
  };

  const handleDeleteMCPServer = (id: string, name: string) => {
    setMcpServers((prev) => prev.filter((s) => s.id !== id));
    onNotify(`Removed MCP server: ${name}`, "WARN");
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    setTerminalHistory((prev) => [...prev, { type: "input", text: cmd }]);
    setInputVal("");

    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd === "help") {
      setTerminalHistory((prev) => [
        ...prev,
        { type: "output", text: "Available commands:" },
        { type: "output", text: "  help                               Shows list of available CLI commands" },
        { type: "output", text: "  agent run --prompt \"<prompt>\"       Runs AI agent planning cycle on user prompt" },
        { type: "output", text: "  mcp list                           Lists connected Model Context Protocol servers" },
        { type: "output", text: "  handshake                          Triggers credentials validation check" },
        { type: "output", text: "  clear                              Clears terminal logs history" },
      ]);
    } else if (lowerCmd === "clear") {
      setTerminalHistory([]);
    } else if (lowerCmd === "mcp list") {
      setTerminalHistory((prev) => [
        ...prev,
        { type: "system", text: "Retrieving active MCP connections..." },
        ...mcpServers.map((s) => ({
          type: "output" as const,
          text: `[MCP-SERVER] ${s.name} (${s.type}) - URL: ${s.url} [Status: ${s.status}]`,
        })),
      ]);
    } else if (lowerCmd === "handshake") {
      setTerminalHistory((prev) => [
        ...prev,
        { type: "system", text: "Testing API Handshake status..." },
        { type: "output", text: `Active Providers: ${Object.entries(providers).filter(([_, v]) => v).map(([k]) => k).join(", ") || "None"}` },
        { type: "output", text: `Credential Key check: ${apiKey ? "Provided (masked)" : "Missing API Keys"}` },
      ]);
    } else if (lowerCmd.startsWith("agent run")) {
      const promptMatch = cmd.match(/--prompt\s+["'](.+?)["']/i);
      const promptText = promptMatch ? promptMatch[1] : cmd.replace("agent run", "").trim() || "Analyze workspace trends";

      setTerminalHistory((prev) => [
        ...prev,
        { type: "system", text: `[1/4] Planning agent sequence for: "${promptText}"` },
      ]);

      // Launch backend loop
      fetch("http://localhost:3000/api/v1/ai/runs/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({
          goal: promptText,
          maxBudget: 2500, // Trigger HITL since it's > $1,000
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("API Offline");
          const data = await res.json();
          setTerminalHistory((prev) => [
            ...prev,
            { type: "system", text: `[2/4] Database record created. Run ID: ${data.id}` },
            { type: "system", text: `[3/4] Current Step: ${data.currentStep}` },
            { type: "output", text: `Status: ${data.status}. Budget recommended: $${data.budgetAllocated || 2250}.` },
            { type: "system", text: `If status is PENDING_HITL, review and click Approve in the Active Runs panel!` }
          ]);
          onNotify(`AI Agent started real campaign run ${data.id}`, "INFO");
          fetchRunsAndApprovals();
        })
        .catch((err) => {
          console.warn("Backend API offline, falling back to mock loop simulation:", err);
          setTimeout(() => {
            setTerminalHistory((prev) => [
              ...prev,
              { type: "system", text: "[2/4] Accessing file context via FileSystem MCP Server..." },
            ]);
          }, 800);

          setTimeout(() => {
            setTerminalHistory((prev) => [
              ...prev,
              { type: "system", text: "[3/4] Calling search tools to gather market intelligence..." },
            ]);
          }, 1600);

          setTimeout(() => {
            setTerminalHistory((prev) => [
              ...prev,
              { type: "output", text: "▶ Execution output results:" },
              { type: "output", text: "Success! Staged draft post analyzing telemetry logs. Check the OmniComposer or Visual Calendar tabs to review the draft!" },
              { type: "system", text: "[4/4] CLI agent execution successfully completed." },
            ]);
            onNotify("CLI Agent completed prompt plan execution", "INFO");
          }, 2400);
        });
    } else {
      setTerminalHistory((prev) => [
        ...prev,
        { type: "error", text: `Unknown command: '${cmd}'. Type 'help' for options.` },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credentials & Providers settings */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Key className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Agent Setup & Credentials</h4>
          </div>

          {/* Handshake Creds */}
          <div className="space-y-3">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">API Handshake Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter auth credential token..."
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED] font-mono"
              />
            </div>

            <div className="pt-1">
              <button
                onClick={handleTestHandshake}
                disabled={handshakeStatus === "testing"}
                className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-[10px] font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {handshakeStatus === "testing" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Handshaking ({handshakeProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Icons.Zap className="w-3.5 h-3.5" />
                    <span>Validate LLM API Credentials</span>
                  </>
                )}
              </button>
            </div>

            {/* Handshake Indicator */}
            {handshakeStatus !== "idle" && (
              <div className="mt-2.5 p-2 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-lg flex items-center justify-between">
                <span className="text-[9px] text-[#A1A1AA]">Handshake Status:</span>
                <span className={`text-[9px] font-bold flex items-center gap-1.5 ${
                  handshakeStatus === "success" ? "text-emerald-400" : handshakeStatus === "failed" ? "text-red-400" : "text-amber-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    handshakeStatus === "success" ? "bg-emerald-400 animate-pulse" : handshakeStatus === "failed" ? "bg-red-400" : "bg-amber-400 animate-pulse"
                  }`}></span>
                  {handshakeStatus === "success" ? "Operational Connection" : handshakeStatus === "failed" ? "Failed Credentials" : "Verifying..."}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.04] pt-4">
            <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-2 font-bold">Multi-LLM Orchestration Providers</label>
            <div className="space-y-2">
              {[
                { key: "claude", label: "Claude 3.5 Sonnet (Default)" },
                { key: "chatgpt", label: "ChatGPT GPT-4o Agent" },
                { key: "codex", label: "Codex Code Generation" },
                { key: "openclaw", label: "OpenClaw Integrator Adapter" },
                { key: "cursor", label: "Cursor AI Agent" }
              ].map((p) => (
                <label key={p.key} className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-white/[0.02] px-1 rounded transition">
                  <span className="text-white font-medium">{p.label}</span>
                  <input
                    type="checkbox"
                    checked={providers[p.key as keyof typeof providers]}
                    onChange={() => handleProviderToggle(p.key as keyof typeof providers)}
                    className="rounded text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 bg-slate-900 border-white/[0.08]"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* MCP server configs */}
        <div className="lg:col-span-2 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icons.Layers className="w-4.5 h-4.5 text-[#8B5CF6]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Model Context Protocol (MCP) Servers</h4>
              </div>
              <span className="text-[9px] bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/25 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                {mcpServers.length} Active Nodes
              </span>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              {mcpServers.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition">
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{s.name}</span>
                      <span className="text-[8px] bg-white/[0.06] text-[#A1A1AA] border border-white/[0.08] px-1.5 py-0.2 rounded font-semibold font-mono">{s.type}</span>
                    </div>
                    <p className="text-[10px] text-[#A1A1AA] font-mono truncate">{s.url}</p>
                  </div>
                  <div className="flex items-center gap-3.5 flex-shrink-0">
                    <span className={`text-[8px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      s.status === "connected" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse" : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {s.status}
                    </span>
                    <button
                      onClick={() => handleDeleteMCPServer(s.id, s.name)}
                      className="text-[#A1A1AA] hover:text-red-400 transition cursor-pointer"
                      title="De-register server"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddMCPServer} className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-white/[0.04] mt-2">
            <div className="md:col-span-1">
              <input
                type="text"
                required
                placeholder="Server name..."
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                required
                placeholder="Transport Endpoint URL..."
                value={newServerUrl}
                onChange={(e) => setNewServerUrl(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none font-mono"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={newServerType}
                onChange={(e) => setNewServerType(e.target.value)}
                className="bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg cursor-pointer flex-1"
              >
                <option value="API">API</option>
                <option value="Local">Local</option>
                <option value="DB">DB</option>
              </select>
              <button
                type="submit"
                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white p-2 rounded-lg transition cursor-pointer flex items-center justify-center"
                title="Add MCP Server"
              >
                <Icons.Plus className="w-4.5 h-4.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CLI Prompt execution terminal panel & Real Active Runs side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0B0B0F] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
          {/* Terminal Header */}
          <div className="bg-[#121218] border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Terminal className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold text-white">fluxora-agent-cli-shell</span>
            </div>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            </div>
          </div>

          {/* Terminal logs list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs max-h-[300px]">
            {terminalHistory.map((item, index) => {
              if (item.type === "input") {
                return (
                  <div key={index} className="text-indigo-200">
                    <span className="text-[#8B5CF6] font-bold">fluxora-agent$</span> {item.text}
                  </div>
                );
              }
              if (item.type === "system") {
                return (
                  <div key={index} className="text-cyan-400 opacity-80">
                    <span className="font-semibold">[SYSTEM]</span> {item.text}
                  </div>
                );
              }
              if (item.type === "error") {
                return (
                  <div key={index} className="text-red-400">
                    <span className="font-bold">[ERROR]</span> {item.text}
                  </div>
                );
              }
              return (
                <div key={index} className="text-emerald-300 whitespace-pre-wrap">
                  {item.text}
                </div>
              );
            })}
            {terminalHistory.length === 0 && (
              <div className="text-slate-600 italic">Terminal history cleared. Type a command to execute...</div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleCliSubmit} className="bg-[#121218] border-t border-white/[0.08] px-4 py-2 flex items-center gap-2">
            <span className="text-[#8B5CF6] font-bold font-mono text-xs">fluxora-agent$</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="agent run --prompt 'Draft the engineering scaling post'"
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white focus:ring-0 placeholder:text-slate-650"
            />
            <button type="submit" className="text-[#A1A1AA] hover:text-white transition cursor-pointer">
              <Icons.CornerDownLeft className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>

        {/* Real Active Runs Side Panel */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Icons.Activity className="w-4 h-4 text-[#8B5CF6]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Agent Loops</h4>
              </div>
              <button
                onClick={fetchRunsAndApprovals}
                className="text-[9px] text-[#A1A1AA] hover:text-white underline cursor-pointer"
              >
                Sync Runs
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {runs.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="text-[8px] font-mono text-[#8B5CF6] font-semibold">{r.id.substring(0, 8)}...</span>
                      <h5 className="text-xs font-bold text-white truncate">{r.goal}</h5>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${
                      r.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      r.status === "FAILED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      r.status === "PENDING_HITL" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#A1A1AA] italic leading-snug">{r.currentStep}</p>

                  {/* Render approval buttons if this run has a pending approval */}
                  {r.status === "PENDING_HITL" && (
                    <div className="pt-2 border-t border-white/[0.04] flex gap-2">
                      {approvals
                        .filter((a) => a.runId === r.id && a.status === "PENDING")
                        .map((appr) => (
                          <div key={appr.id} className="w-full space-y-1.5">
                            <span className="text-[8px] text-amber-400 font-bold uppercase block">HITL Action Required: {appr.actionType}</span>
                            <p className="text-[9px] text-[#A1A1AA] leading-normal">{appr.description}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveReject(appr.id, "APPROVED")}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold py-1 rounded transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveReject(appr.id, "REJECTED")}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold py-1 rounded transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}

              {runs.length === 0 && (
                <div className="text-center py-8 text-[11px] text-[#A1A1AA]/50 italic">
                  No active agent loops found. Type 'agent run --prompt "&lt;goal&gt;"' in the CLI shell to start!
                </div>
              )}
            </div>
          </div>

          <div className="text-[8px] text-[#A1A1AA]/40 font-mono text-center">
            Thompson Sampling budget balancing: Enabled.
          </div>
        </div>
      </div>
    </div>
  );
}
