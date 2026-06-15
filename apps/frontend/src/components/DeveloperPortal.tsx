"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthApp {
  name: string;
  clientId: string;
  scopes: string[];
  status: "active" | "disconnected";
}

interface WebhookLog {
  timestamp: string;
  event: string;
  endpoint: string;
  status: number;
}

interface DeveloperPortalProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

const SNIPPETS = {
  curl: `curl -X POST "https://api.fluxora.io/v1/posts" \\
  -H "Authorization: Bearer fluxora_live_2b86556e9c991e6ad65f6f" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Deploying scalable telemetry engines!",
    "scheduledAt": "2026-06-18T10:00:00Z",
    "platforms": ["linkedin", "twitter"]
  }'`,
  nodejs: `const { FluxoraClient } = require('@fluxora/sdk');
const client = new FluxoraClient({
  apiKey: 'fluxora_live_2b86556e9c991e6ad65f6f'
});

async function publish() {
  const post = await client.posts.create({
    content: 'Deploying scalable telemetry engines!',
    scheduledAt: new Date('2026-06-18T10:00:00Z'),
    platforms: ['linkedin', 'twitter']
  });
  console.log('Post Scheduled:', post.id);
}
publish();`,
  python: `from fluxora import FluxoraClient

client = FluxoraClient(api_key="fluxora_live_2b86556e9c991e6ad65f6f")

post = client.posts.create(
    content="Deploying scalable telemetry engines!",
    scheduled_at="2026-06-18T10:00:00Z",
    platforms=["linkedin", "twitter"]
)
print(f"Scheduled Post: {post.id}")`
};

export default function DeveloperPortal({ onNotify }: DeveloperPortalProps) {
  const [subTab, setSubTab] = useState<"api" | "oauth" | "webhooks">("api");
  const [apiKey, setApiKey] = useState("fluxora_live_2b86556e9c991e6ad65f6f");
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "nodejs" | "python">("curl");

  // OAuth Credentials States
  const [scopes, setScopes] = useState({
    "read:posts": true,
    "write:posts": true,
    "read:analytics": true,
    "write:settings": false
  });
  const [whitelistedApps, setWhitelistedApps] = useState<AuthApp[]>([
    { name: "Make.com Flow Integrator", clientId: "cli_990182ba", scopes: ["read:posts", "write:posts"], status: "active" },
    { name: "Zapier Publisher", clientId: "cli_1029ba88", scopes: ["read:posts", "read:analytics"], status: "active" },
    { name: "Internal Custom BI Dashboard", clientId: "cli_330182cf", scopes: ["read:analytics"], status: "disconnected" }
  ]);

  // API Tester Console States
  const [testEndpoint, setTestEndpoint] = useState("/v1/posts");
  const [testMethod, setTestMethod] = useState("POST");
  const [testBody, setTestBody] = useState(`{\n  "content": "Deploying scalable telemetry engines!",\n  "platforms": ["linkedin", "twitter"]\n}`);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  // Webhook log stream
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    { timestamp: "18:12:04", event: "post.published", endpoint: "https://api.myagency.com/hooks/fluxora", status: 200 },
    { timestamp: "18:12:06", event: "post.click", endpoint: "https://api.myagency.com/hooks/fluxora", status: 200 },
    { timestamp: "18:14:15", event: "milestone.reached", endpoint: "https://errors.myagency.com/receiver", status: 500 }
  ]);

  const handleTestRequest = () => {
    setTestingEndpoint(true);
    onNotify(`Public API Tester: Dispatching mock request to ${testEndpoint}`, "INFO");

    setTimeout(() => {
      if (testEndpoint === "/v1/posts" && testMethod === "POST") {
        setTestResponse(JSON.stringify({
          id: `post-api-${Date.now().toString().slice(-4)}`,
          status: "scheduled",
          content: "Deploying scalable telemetry engines!",
          scheduledAt: new Date(Date.now() + 172800000).toISOString(),
          platforms: ["linkedin", "twitter"],
          tenantId: "Fluxora-Tenant-098",
          workspaceId: "ws-1"
        }, null, 2));
      } else if (testEndpoint === "/v1/analytics/performance") {
        setTestResponse(JSON.stringify({
          views: 142800,
          clicks: 8491,
          shares: 1240,
          workspaceId: "ws-1",
          engine: "ClickHouse persistence fallback"
        }, null, 2));
      } else {
        setTestResponse(JSON.stringify({
          error: "Endpoint not found",
          code: 404
        }, null, 2));
      }
      setTestingEndpoint(false);
      onNotify("Public API Tester: Received response code 200 OK", "INFO");
    }, 1000);
  };

  const handleGenerateNewToken = () => {
    const newToken = "fluxora_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newToken);
    onNotify("Generated a new developer credentials API Key", "WARN");
  };

  const toggleAppStatus = (clientId: string) => {
    setWhitelistedApps(prev => prev.map(app => {
      if (app.clientId === clientId) {
        const nextStatus = app.status === "active" ? "disconnected" : "active";
        onNotify(`Application status changed for Client ID: ${clientId}`, "WARN");
        return { ...app, status: nextStatus };
      }
      return app;
    }));
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-pink-500 flex items-center justify-center">
            <Icons.Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Developer Center</h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Manage OAuth credentials, Public APIs scopes, and SDK delivery testings.</p>
          </div>
        </div>

        {/* Section Select */}
        <div className="bg-[#0B0B0F] border border-white/[0.08] p-1 rounded-xl flex gap-1">
          {["api", "oauth", "webhooks"].map(s => (
            <button
              key={s}
              onClick={() => setSubTab(s as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                subTab === s ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {s === "api" ? "APIs & SDKs" : s === "oauth" ? "OAuth2 Clients" : "Webhook Log"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === "api" && (
          <motion.div
            key="api"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* API Key credential */}
            <div className="bg-[#0B0B0F]/50 border border-white/[0.06] p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">API Credentials</h4>
                  <p className="text-[10px] text-[#A1A1AA]">Secure key used for auth headers inside custom scripts/SDKs.</p>
                </div>
                <button
                  onClick={handleGenerateNewToken}
                  className="text-[9px] bg-red-650 hover:bg-red-550 border border-red-800/20 text-white px-2 py-1 rounded transition cursor-pointer"
                >
                  Regenerate Token
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  readOnly
                  value={apiKey}
                  className="flex-1 bg-[#121218] border border-white/[0.08] text-xs text-white rounded-lg px-3 py-2.5 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    onNotify("Copied API key to clipboard", "INFO");
                  }}
                  className="bg-[#121218] hover:bg-[#181821] border border-white/[0.08] text-xs font-bold text-white px-4 rounded-xl transition cursor-pointer"
                >
                  Copy Key
                </button>
              </div>

              {/* Endpoint status */}
              <div className="grid grid-cols-3 gap-3 border-t border-white/[0.04] pt-4">
                {[
                  { path: "POST /v1/posts", status: "Operational", color: "bg-emerald-500" },
                  { path: "GET /v1/analytics", status: "Operational", color: "bg-emerald-500" },
                  { path: "GET /v1/workspaces", status: "Operational", color: "bg-emerald-500" }
                ].map(ep => (
                  <div key={ep.path} className="bg-[#121218]/50 border border-white/[0.04] p-3 rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white">{ep.path}</span>
                    <span className="text-[9px] text-[#A1A1AA] flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${ep.color}`}></span>
                      {ep.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SDK Interactive snippets */}
              <div className="bg-[#0B0B0F]/50 border border-white/[0.06] p-5 rounded-xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-2 mb-3">
                    <h4 className="text-xs font-bold text-white">Interactive SDK Documentation</h4>
                    <div className="flex gap-1.5 bg-[#121218] p-0.5 rounded border border-white/[0.08]">
                      {(["curl", "nodejs", "python"] as const).map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`px-2 py-0.5 rounded text-[8px] font-bold capitalize transition cursor-pointer ${
                            selectedLanguage === lang ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <pre className="text-[10px] bg-[#121218] p-4.5 rounded-xl font-mono text-indigo-200 overflow-x-auto leading-relaxed max-h-[180px]">
                    {SNIPPETS[selectedLanguage]}
                  </pre>
                </div>
                <p className="text-[9px] text-[#A1A1AA]/60">Check endpoints schema payload and properties inside standard headers request formats.</p>
              </div>

              {/* Request Tester Console */}
              <div className="bg-[#0B0B0F]/50 border border-white/[0.06] p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                  <h4 className="text-xs font-bold text-white">Live Request/Response Tester</h4>
                  <span className="text-[9px] text-[#8B5CF6] font-mono">Sandbox Console</span>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={testMethod}
                      onChange={e => setTestMethod(e.target.value)}
                      className="bg-[#121218] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1.5 cursor-pointer"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                    <select
                      value={testEndpoint}
                      onChange={e => {
                        setTestEndpoint(e.target.value);
                        if (e.target.value === "/v1/analytics/performance") {
                          setTestMethod("GET");
                          setTestBody("");
                        } else {
                          setTestMethod("POST");
                          setTestBody(`{\n  "content": "Deploying scalable telemetry engines!",\n  "platforms": ["linkedin", "twitter"]\n}`);
                        }
                      }}
                      className="flex-1 bg-[#121218] border border-white/[0.08] text-white text-[10px] rounded-lg px-3 py-1.5 cursor-pointer"
                    >
                      <option value="/v1/posts">/v1/posts (Publish Post)</option>
                      <option value="/v1/analytics/performance">/v1/analytics/performance (Fetch performance metrics)</option>
                    </select>
                  </div>

                  {testMethod === "POST" && (
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Body Payload JSON</label>
                      <textarea
                        value={testBody}
                        onChange={e => setTestBody(e.target.value)}
                        className="w-full h-20 bg-[#121218] border border-white/[0.08] text-[10px] font-mono text-white p-2 rounded-lg resize-none focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleTestRequest}
                    disabled={testingEndpoint}
                    className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
                  >
                    {testingEndpoint ? "Executing test call..." : "⚡ Send Sandbox Request"}
                  </button>

                  {testResponse && (
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 block">JSON Response Body</span>
                      <pre className="text-[9px] bg-[#121218] p-3 rounded-xl font-mono text-emerald-400 max-h-[140px] overflow-y-auto leading-relaxed">
                        {testResponse}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === "oauth" && (
          <motion.div
            key="oauth"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* OAuth Credentials setup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Permission Scopes */}
              <div className="bg-[#0B0B0F]/50 border border-white/[0.06] p-5 rounded-xl space-y-4">
                <div className="border-b border-white/[0.04] pb-2">
                  <h4 className="text-xs font-bold text-white uppercase">OAuth Scope Configuration</h4>
                </div>

                <div className="space-y-3">
                  {Object.entries(scopes).map(([scName, active]) => (
                    <label key={scName} className="flex items-center justify-between text-xs cursor-pointer select-none">
                      <span className="font-mono text-white">{scName}</span>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => {
                          setScopes(prev => ({ ...prev, [scName]: !active }));
                          onNotify(`Updated active permission scope: ${scName}`, "WARN");
                        }}
                        className="rounded text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 bg-slate-900 border-white/[0.08]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Authorized App Whitelist Table */}
              <div className="md:col-span-2 bg-[#0B0B0F]/50 border border-white/[0.06] p-5 rounded-xl space-y-4">
                <div className="border-b border-white/[0.04] pb-2">
                  <h4 className="text-xs font-bold text-white uppercase">Whitelisted Applications</h4>
                </div>

                <div className="space-y-3">
                  {whitelistedApps.map(app => (
                    <div key={app.clientId} className="flex items-center justify-between p-3 bg-[#121218]/60 border border-white/[0.04] rounded-lg">
                      <div>
                        <h5 className="text-xs font-bold text-white">{app.name}</h5>
                        <p className="text-[9px] text-[#A1A1AA] font-mono mt-0.5">ID: {app.clientId} • Scopes: {app.scopes.join(", ")}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                          app.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {app.status}
                        </span>
                        <button
                          onClick={() => toggleAppStatus(app.clientId)}
                          className={`text-[9px] font-semibold hover:underline cursor-pointer ${
                            app.status === "active" ? "text-red-400" : "text-[#8B5CF6]"
                          }`}
                        >
                          {app.status === "active" ? "Disconnect" : "Re-connect"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === "webhooks" && (
          <motion.div
            key="webhooks"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Real-time Webhook Delivery Logs</h4>
              <button
                onClick={() => {
                  setWebhookLogs([
                    { timestamp: new Date().toLocaleTimeString(), event: "post.dispatched", endpoint: "https://api.myagency.com/hooks/fluxora", status: 200 },
                    ...webhookLogs
                  ]);
                  onNotify("Injected test webhook logs event", "INFO");
                }}
                className="text-[9px] text-[#8B5CF6] hover:underline cursor-pointer"
              >
                Simulate Delivery
              </button>
            </div>

            <div className="bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#121218]/80 text-[10px] uppercase font-bold text-[#A1A1AA] border-b border-white/[0.08] font-mono">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event Topic</th>
                    <th className="p-3">Endpoint Endpoint</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-[10px]">
                  {webhookLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-white/[0.02] transition">
                      <td className="p-3 text-[#A1A1AA]/60">{log.timestamp}</td>
                      <td className="p-3 text-white font-bold">{log.event}</td>
                      <td className="p-3 text-[#A1A1AA]">{log.endpoint}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          log.status === 200 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
