"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectorTemplate {
  id: string;
  name: string;
  platform: "n8n" | "Make" | "Zapier";
  description: string;
  active: boolean;
  triggers: string[];
}

interface WebhookLog {
  id: string;
  direction: "INCOMING" | "OUTGOING";
  timestamp: string;
  event: string;
  node: string;
  status: number;
  payload: string;
  response: string;
}

interface ThirdPartyConnectorsProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function ThirdPartyConnectors({ onNotify }: ThirdPartyConnectorsProps) {
  // Connection states
  const [nodes, setNodes] = useState([
    { id: "node-n8n", name: "n8n Workflow Server", platform: "n8n", status: "connected", latency: "112ms", lastSync: "3 mins ago" },
    { id: "node-make", name: "Make.com Operations Engine", platform: "Make", status: "connected", latency: "245ms", lastSync: "12 mins ago" },
    { id: "node-zapier", name: "Zapier Zaps Automation", platform: "Zapier", status: "disconnected", latency: "--", lastSync: "Never" },
  ]);

  // Gallery Templates
  const [templates, setTemplates] = useState<ConnectorTemplate[]>([
    { id: "tpl-1", name: "Publishing Failure Alert to Slack", platform: "n8n", description: "Sends rich message blocks to Slack channels when any Temporal scheduling workflow errors.", active: true, triggers: ["post.failed"] },
    { id: "tpl-2", name: "Google Sheets Analytics Sync", platform: "Make", description: "Pulls aggregated ClickHouse metrics and inserts rows daily into audit spread sheets.", active: false, triggers: ["analytics.refreshed"] },
    { id: "tpl-3", name: "Post Generation from Airtable Row", platform: "Zapier", description: "Triggers AI assistant to build drafts when new records appear in client Airtable bases.", active: false, triggers: ["post.created"] },
    { id: "tpl-4", name: "Discord Notification on Success", platform: "n8n", description: "Pings Discord webhook on successful publishing events across workspaces.", active: false, triggers: ["post.published"] },
  ]);

  // Custom Triggers Configuration
  const [customTriggers, setCustomTriggers] = useState({
    "post.created": true,
    "post.published": true,
    "post.failed": true,
    "analytics.refreshed": false,
    "billing.limit_reached": true,
  });

  // Data Payload mapping variables
  const [sourceKeys, setSourceKeys] = useState([
    { id: "s1", name: "postId", mappedTo: "post_id" },
    { id: "s2", name: "workspaceId", mappedTo: "workspace_identifier" },
    { id: "s3", name: "content", mappedTo: "text_body" },
    { id: "s4", name: "publishedAt", mappedTo: "time_dispatched" },
  ]);
  const [newSourceKey, setNewSourceKey] = useState("");
  const [newTargetKey, setNewTargetKey] = useState("");

  // Webhook log list
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    { id: "wh-1", direction: "OUTGOING", timestamp: "18:24:12", event: "post.failed", node: "n8n Workflow Server", status: 200, payload: '{\n  "postId": "post-9081",\n  "workspaceId": "ws-1",\n  "error": "Twitter token expired"\n}', response: '{\n  "status": "success",\n  "notified": "slack_channel"\n}' },
    { id: "wh-2", direction: "INCOMING", timestamp: "18:20:05", event: "post.created", node: "Zapier Zaps Automation", status: 201, payload: '{\n  "title": "Staged post",\n  "content": "Kafka analytics stream pipeline"\n}', response: '{\n  "id": "post-api-110",\n  "state": "staged"\n}' },
    { id: "wh-3", direction: "OUTGOING", timestamp: "18:18:50", event: "analytics.refreshed", node: "Make.com Operations Engine", status: 500, payload: '{\n  "clicks": 4200,\n  "views": 105000\n}', response: '{\n  "error": "Bad Request: Column schema mismatch"\n}' },
  ]);

  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/automations/webhooks", {
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const firstSub = data[0];
          setSubscriptionId(firstSub.id);
          
          const triggers = {
            "post.created": firstSub.eventTypes.includes("post.created"),
            "post.published": firstSub.eventTypes.includes("post.published"),
            "post.failed": firstSub.eventTypes.includes("post.failed"),
            "analytics.refreshed": firstSub.eventTypes.includes("analytics.refreshed"),
            "billing.limit_reached": firstSub.eventTypes.includes("billing.limit_reached"),
          };
          setCustomTriggers(triggers);
        }
      }
    } catch (err) {
      console.warn("Webhook Subscriptions API offline, using mocks:", err);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const toggleTemplateActive = (id: string, name: string) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        const nextVal = !t.active;
        onNotify(`Template "${name}" ${nextVal ? "activated" : "deactivated"}`, "INFO");
        return { ...t, active: nextVal };
      }
      return t;
    }));
  };

  const handleTestConnection = (id: string, name: string) => {
    onNotify(`Testing automation node connection for: ${name}`, "INFO");
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, status: "syncing" };
      }
      return n;
    }));

    setTimeout(() => {
      setNodes(prev => prev.map(n => {
        if (n.id === id) {
          const lat = Math.floor(80 + Math.random() * 200) + "ms";
          onNotify(`Connection to ${name} established successfully. Latency: ${lat}`, "INFO");
          return { ...n, status: "connected", latency: lat, lastSync: "Just now" };
        }
        return n;
      }));
    }, 1000);
  };

  const handleTriggerToggle = async (key: keyof typeof customTriggers) => {
    const nextVal = !customTriggers[key];
    const updatedTriggers = { ...customTriggers, [key]: nextVal };
    
    const activeEvents = Object.keys(updatedTriggers).filter(
      (k) => updatedTriggers[k as keyof typeof customTriggers]
    );

    try {
      let response;
      if (subscriptionId) {
        response = await fetch(`http://localhost:3000/api/v1/automations/webhooks/${subscriptionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": "Fluxora-Tenant-098",
            "X-Workspace-ID": "ws-1",
          },
          body: JSON.stringify({
            eventTypes: activeEvents,
          }),
        });
      } else {
        response = await fetch("http://localhost:3000/api/v1/automations/webhooks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": "Fluxora-Tenant-098",
            "X-Workspace-ID": "ws-1",
          },
          body: JSON.stringify({
            url: "http://n8n-workflow-router.local/webhook",
            eventTypes: activeEvents,
          }),
        });
      }

      if (response.ok) {
        onNotify(`Event trigger ${key} ${nextVal ? "subscribed" : "unsubscribed"}`, "INFO");
        loadSubscriptions();
      } else {
        throw new Error("Webhook update API failed");
      }
    } catch (err) {
      console.warn("Webhook API failed, falling back locally:", err);
      setCustomTriggers(prev => ({ ...prev, [key]: nextVal }));
      onNotify(`Event trigger ${key} ${nextVal ? "subscribed" : "unsubscribed"}`, "INFO");
    }
  };

  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceKey || !newTargetKey) return;
    setSourceKeys(prev => [...prev, { id: `m-${Date.now()}`, name: newSourceKey, mappedTo: newTargetKey }]);
    setNewSourceKey("");
    setNewTargetKey("");
    onNotify("Added payload mapping key translation", "INFO");
  };

  const handleRemoveMapping = (id: string) => {
    setSourceKeys(prev => prev.filter(k => k.id !== id));
    onNotify("Removed payload mapping key translation", "WARN");
  };

  // Generate transformed output mock
  const getTransformedJSON = () => {
    const obj: Record<string, string> = {};
    sourceKeys.forEach(k => {
      let val = `source_data.${k.name}`;
      if (k.name === "postId") val = "post-9081";
      if (k.name === "workspaceId") val = "ws-1";
      if (k.name === "content") val = "Achieving <1.5s telemetry sync across workspaces";
      if (k.name === "publishedAt") val = "2026-06-15T18:20:00Z";
      obj[k.mappedTo] = val;
    });
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Node Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {nodes.map((node) => {
          let platformColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
          if (node.platform === "Make") platformColor = "text-pink-400 bg-pink-500/10 border-pink-500/20";
          if (node.platform === "Zapier") platformColor = "text-orange-400 bg-orange-500/10 border-orange-500/20";

          return (
            <div key={node.id} className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4.5 shadow-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${platformColor}`}>{node.platform}</span>
                  <h4 className="text-xs font-bold text-white truncate max-w-[140px]">{node.name}</h4>
                </div>
                <div className="text-[10px] text-[#A1A1AA] space-y-0.5 font-mono">
                  <div>Latency: <span className="text-white">{node.latency}</span></div>
                  <div>Last Sync: <span>{node.lastSync}</span></div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2.5">
                <span className={`text-[8px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  node.status === "connected" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  node.status === "syncing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                  "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {node.status}
                </span>

                <button
                  onClick={() => handleTestConnection(node.id, node.name)}
                  className="bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-[9px] text-white px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Test Connection
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Icons.LayoutGrid className="w-4 h-4 text-[#8B5CF6]" />
              <span>Pre-Built Workflow Integration Templates</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => {
              let logo = <Icons.Workflow className="w-5 h-5 text-purple-400" />;
              if (tpl.platform === "Make") logo = <Icons.ZapOff className="w-5 h-5 text-pink-400" />;
              if (tpl.platform === "Zapier") logo = <Icons.Zap className="w-5 h-5 text-orange-400" />;

              return (
                <div key={tpl.id} className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4.5 shadow-xl flex flex-col justify-between hover:border-white/[0.12] transition">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-[#0B0B0F] flex items-center justify-center border border-white/[0.08]">
                        {logo}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={tpl.active}
                          onChange={() => toggleTemplateActive(tpl.id, tpl.name)}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-slate-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#A1A1AA] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7C3AED] peer-checked:after:bg-white" />
                      </label>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-white">{tpl.name}</h5>
                      <p className="text-[10px] text-[#A1A1AA] mt-1.5 leading-relaxed">{tpl.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/[0.04] flex flex-wrap gap-1">
                    {tpl.triggers.map(trig => (
                      <span key={trig} className="text-[8px] font-mono bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 px-1.5 py-0.2 rounded">
                        trigger: {trig}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trigger configs */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 mb-2">
            <Icons.Filter className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Webhook Trigger Subscriptions</h4>
          </div>

          <div className="space-y-3">
            {[
              { key: "post.created", label: "On Staged Post Created" },
              { key: "post.published", label: "On Omnichannel Post Published" },
              { key: "post.failed", label: "On Scheduling Publish Failure" },
              { key: "analytics.refreshed", label: "On Clickhouse Metrics Refreshed" },
              { key: "billing.limit_reached", label: "On Billing Seat Limit warning" }
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between text-xs cursor-pointer select-none py-1 hover:bg-white/[0.02] px-1 rounded transition">
                <span className="text-white font-medium">{item.label}</span>
                <input
                  type="checkbox"
                  checked={customTriggers[item.key as keyof typeof customTriggers]}
                  onChange={() => handleTriggerToggle(item.key as keyof typeof customTriggers)}
                  className="rounded text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 bg-slate-900 border-white/[0.08]"
                />
              </label>
            ))}
          </div>
          <p className="text-[9px] text-[#A1A1AA]/60 font-mono">Subscribes external endpoints to events broadcasted by Kafka pipelines.</p>
        </div>
      </div>

      {/* Payload mapping and transformation preview panels */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <Icons.GitCommit className="w-4.5 h-4.5 text-[#8B5CF6]" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Payload Mapping & Data Transformation Editor</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Active Translation Rules</h5>
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {sourceKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-2.5 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-lg text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8B5CF6]">{k.name}</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    <span className="text-emerald-400">{k.mappedTo}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveMapping(k.id)}
                    className="text-[#A1A1AA] hover:text-red-400 transition"
                  >
                    <Icons.Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleAddMapping} className="grid grid-cols-3 gap-2 pt-2">
              <input
                type="text"
                required
                placeholder="sourceKey..."
                value={newSourceKey}
                onChange={e => setNewSourceKey(e.target.value)}
                className="bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none font-mono"
              />
              <input
                type="text"
                required
                placeholder="targetKey..."
                value={newTargetKey}
                onChange={e => setNewTargetKey(e.target.value)}
                className="bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold py-2 rounded-lg transition"
              >
                Add Link
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h5 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Transformed JSON Preview</h5>
            <pre className="bg-[#0B0B0F] border border-white/[0.08] p-4.5 rounded-xl text-[10px] font-mono text-emerald-400 leading-relaxed max-h-[200px] overflow-y-auto">
              {getTransformedJSON()}
            </pre>
          </div>
        </div>
      </div>

      {/* Webhook logs */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Icons.Activity className="w-4 h-4 text-[#8B5CF6]" />
          <span>Webhook Request & Response Monitors</span>
        </h4>

        <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0B0F] text-[9px] uppercase font-bold text-[#A1A1AA] border-b border-white/[0.08] font-mono">
                <th className="p-3">Time</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Event topic</th>
                <th className="p-3">Integration node</th>
                <th className="p-3">HTTP Status</th>
                <th className="p-3 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-[10px]">
              {webhookLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-3 text-[#A1A1AA]/60">{log.timestamp}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.2 rounded font-bold text-[9px] ${
                      log.direction === "INCOMING" ? "bg-blue-950 text-blue-400" : "bg-purple-950 text-purple-400"
                    }`}>
                      {log.direction}
                    </span>
                  </td>
                  <td className="p-3 text-white font-bold">{log.event}</td>
                  <td className="p-3 text-[#A1A1AA]">{log.node}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      log.status === 200 || log.status === 201 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-[#8B5CF6] hover:underline text-[9px] cursor-pointer"
                    >
                      View Body
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Drawer Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-[#0B0B0F]/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#121218] border border-white/[0.08] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Webhook Transaction Inspector</h4>
                  <p className="text-[10px] text-[#A1A1AA] mt-0.5 font-mono">Log ID: {selectedLog.id} • Node: {selectedLog.node}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 hover:bg-white/[0.04] rounded-lg text-[#A1A1AA] hover:text-white transition cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-bold">Request Payload JSON</span>
                  <pre className="bg-[#0B0B0F] border border-white/[0.08] p-3 rounded-xl text-[9px] font-mono text-cyan-400 overflow-y-auto max-h-[220px] leading-relaxed">
                    {selectedLog.payload}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-bold">Node Response Body</span>
                  <pre className="bg-[#0B0B0F] border border-white/[0.08] p-3 rounded-xl text-[9px] font-mono text-emerald-400 overflow-y-auto max-h-[220px] leading-relaxed">
                    {selectedLog.response}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
