"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DBTestNode {
  id: string;
  name: string;
  type: string;
  status: "idle" | "testing" | "success" | "error";
  latency?: string;
  details?: string;
}

interface SelfHostedConfigProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function SelfHostedConfig({ onNotify }: SelfHostedConfigProps) {
  // Stepper Wizard for Environment Variables
  const [activeStep, setActiveStep] = useState(1);
  const [envVars, setEnvVars] = useState({
    DATABASE_URL: "postgresql://postgres:secret@localhost:5432/fluxora",
    REDIS_URL: "redis://localhost:6379",
    KAFKA_BOOTSTRAP_SERVERS: "localhost:9092",
    CLICKHOUSE_HOST: "http://localhost:8123",
    JWT_SECRET: "fluxora_secret_jwt_sign_key",
    PORT: "3000",
  });

  // DB Connections diagnostic checkers
  const [dbNodes, setDbNodes] = useState<DBTestNode[]>([
    { id: "db-postgres", name: "PostgreSQL Database", type: "Transactional", status: "idle" },
    { id: "db-redis", name: "Redis Caching Cache", type: "Session Vault", status: "idle" },
    { id: "db-kafka", name: "Apache Kafka Ingestion Stream", type: "Event Stream", status: "idle" },
    { id: "db-clickhouse", name: "ClickHouse OLAP Database", type: "Aggregated Analytics", status: "idle" },
  ]);

  // Data privacy options
  const [retentionDays, setRetentionDays] = useState("90");
  const [gdprPurge, setGdprPurge] = useState(true);

  // SMTP configuration variables
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.sendgrid.net",
    port: "587",
    user: "apikey",
    pass: "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  });
  const [testEmailVal, setTestEmailVal] = useState("dev@myagency.com");
  const [sendingTestMail, setSendingTestMail] = useState(false);

  // Updates and builds dashboards
  const [currentVersion, setCurrentVersion] = useState("v1.2.0-beta");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "update-available" | "deploying" | "up-to-date">("idle");
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  const handleTestDatabase = (id: string, name: string) => {
    setDbNodes(prev => prev.map(node => (node.id === id ? { ...node, status: "testing" } : node)));
    onNotify(`Diagnostics: Pinging database instance: ${name}`, "INFO");

    setTimeout(() => {
      setDbNodes(prev => prev.map(node => {
        if (node.id === id) {
          const isSuccessful = id !== "db-redis"; // mock success
          const lat = isSuccessful ? Math.floor(12 + Math.random() * 30) + "ms" : undefined;
          onNotify(
            isSuccessful ? `Diagnostics: ${name} connected. Latency: ${lat}` : `Diagnostics: ${name} connection failed!`,
            isSuccessful ? "INFO" : "WARN"
          );
          return {
            ...node,
            status: isSuccessful ? "success" : "error",
            latency: lat,
            details: isSuccessful ? "Connection established" : "ERR: Connection Refused"
          };
        }
        return node;
      }));
    }, 1200);
  };

  const handleCopyEnvText = () => {
    const text = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join("\n");
    navigator.clipboard.writeText(text);
    onNotify("Copied environment configuration variables to clipboard", "INFO");
    alert("Environment configuration variables copied to clipboard!");
  };

  const handleSendTestMail = (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTestMail(true);
    onNotify(`SMTP: Dispatching transaction test mail to ${testEmailVal}`, "INFO");

    setTimeout(() => {
      setSendingTestMail(false);
      onNotify("SMTP: Test mail delivered successfully", "AUDIT");
      alert(`Success! Check mail box at ${testEmailVal} for verification.`);
    }, 1500);
  };

  const handleCheckUpdates = () => {
    setUpdateStatus("checking");
    onNotify("Checking self-hosted repository registry for updates...", "INFO");

    setTimeout(() => {
      setUpdateStatus("update-available");
      onNotify("Self-Hosted check: New version v1.2.1 is available for deployment", "WARN");
    }, 1000);
  };

  const handleDeployUpdate = () => {
    setUpdateStatus("deploying");
    setDeploymentProgress(0);
    onNotify("Deploying new update release v1.2.1...", "INFO");

    const timer = setInterval(() => {
      setDeploymentProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setUpdateStatus("up-to-date");
          setCurrentVersion("v1.2.1");
          onNotify("Self-Hosted: System update check completed. Platform running on v1.2.1", "AUDIT");
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* DB Connection diagnostics */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-3 mb-1">
          <div className="flex items-center gap-2">
            <Icons.Database className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Local storage & Database Diagnostics</h4>
          </div>
          <span className="text-[9px] bg-slate-900 border border-white/[0.08] px-2.5 py-0.5 rounded-full font-mono font-semibold text-[#A1A1AA]">
            Local Sandbox Fallbacks Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {dbNodes.map(node => (
            <div key={node.id} className="bg-[#0B0B0F]/50 border border-white/[0.04] p-3.5 rounded-xl flex flex-col justify-between hover:border-white/[0.08] transition">
              <div>
                <span className="text-[9px] font-mono text-[#A1A1AA] uppercase block">{node.type}</span>
                <h5 className="text-xs font-bold text-white mt-0.5 leading-snug">{node.name}</h5>
              </div>

              {node.status !== "idle" && (
                <div className="my-3 font-mono text-[10px] space-y-0.5">
                  <div className="text-white">Status: <span className={
                    node.status === "success" ? "text-emerald-400 font-bold" : node.status === "error" ? "text-red-400 font-bold" : "text-amber-400"
                  }>{node.status === "success" ? "Connected" : node.status === "error" ? "Failed" : "Pinging..."}</span></div>
                  {node.latency && <div className="text-[#A1A1AA]/60">Latency: <span className="text-white font-bold">{node.latency}</span></div>}
                  {node.details && <div className="text-[9px] text-[#A1A1AA]/45 italic">{node.details}</div>}
                </div>
              )}

              <div className="mt-4 pt-2 border-t border-white/[0.04] flex justify-end">
                <button
                  onClick={() => handleTestDatabase(node.id, node.name)}
                  disabled={node.status === "testing"}
                  className="bg-[#121218] hover:bg-[#181821] border border-white/[0.08] text-[9px] text-white px-2.5 py-1 rounded transition cursor-pointer"
                >
                  {node.status === "testing" ? "Testing..." : "Verify Connection"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration wizard and SMTP config panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environment setup wizard stepper */}
        <div className="lg:col-span-2 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Icons.FileCode className="w-4.5 h-4.5 text-[#8B5CF6]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Self-Hosted Env variable setup wizard</h4>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(step => (
                  <button
                    key={step}
                    onClick={() => setActiveStep(step)}
                    className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border transition ${
                      activeStep === step
                        ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                        : "bg-slate-900 text-[#A1A1AA] border-white/[0.08] hover:text-white"
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper Wizard steps */}
            <div className="space-y-4 min-h-[160px]">
              {activeStep === 1 && (
                <div className="space-y-3">
                  <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Step 1: Database Credentials</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">PostgreSQL URL</label>
                      <input
                        type="text"
                        value={envVars.DATABASE_URL}
                        onChange={e => setEnvVars({ ...envVars, DATABASE_URL: e.target.value })}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">Redis Connection URL</label>
                      <input
                        type="text"
                        value={envVars.REDIS_URL}
                        onChange={e => setEnvVars({ ...envVars, REDIS_URL: e.target.value })}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-3">
                  <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Step 2: Message & Telemetry Stores</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">Kafka bootstrap servers</label>
                      <input
                        type="text"
                        value={envVars.KAFKA_BOOTSTRAP_SERVERS}
                        onChange={e => setEnvVars({ ...envVars, KAFKA_BOOTSTRAP_SERVERS: e.target.value })}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">ClickHouse HTTP endpoint</label>
                      <input
                        type="text"
                        value={envVars.CLICKHOUSE_HOST}
                        onChange={e => setEnvVars({ ...envVars, CLICKHOUSE_HOST: e.target.value })}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-3">
                  <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Step 3: Security & Ports</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">JWT Token Signing Secret</label>
                      <input
                        type="text"
                        value={envVars.JWT_SECRET}
                        onChange={e => setEnvVars({ ...envVars, JWT_SECRET: e.target.value })}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">Deployment Server Port</label>
                      <input
                        type="text"
                        value={envVars.PORT}
                        onChange={e => setEnvVars({ ...envVars, PORT: e.target.value })}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-white/[0.04] pt-4 mt-2">
            <span className="text-[9px] text-[#A1A1AA]/50 font-mono">Create an `.env` config file in workspace root path</span>
            <button
              onClick={handleCopyEnvText}
              className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Copy Env Variables
            </button>
          </div>
        </div>

        {/* Mail SMTP Server inputs */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5 mb-1">
            <Icons.Mail className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Independent SMTP Mail Server</h4>
          </div>

          <div className="space-y-3 text-[11px] text-white">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-1.5 rounded focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Port</label>
                <input
                  type="text"
                  value={smtpConfig.port}
                  onChange={e => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-1.5 rounded focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Sender Auth Username</label>
              <input
                type="text"
                value={smtpConfig.user}
                onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-1.5 rounded focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Sender SMTP Password</label>
              <input
                type="password"
                value={smtpConfig.pass}
                onChange={e => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-1.5 rounded focus:outline-none font-mono"
              />
            </div>

            {/* Test Mail Form */}
            <form onSubmit={handleSendTestMail} className="pt-2.5 border-t border-white/[0.04] space-y-2">
              <input
                type="email"
                required
                value={testEmailVal}
                onChange={e => setTestEmailVal(e.target.value)}
                placeholder="Send verification email to..."
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-[10px] text-white p-1.5 rounded focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={sendingTestMail}
                className="w-full bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-[9px] text-white py-1.5 rounded font-semibold transition"
              >
                {sendingTestMail ? "Sending..." : "Send SMTP Test Mail"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Version Checker and Data privacy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Version dashboard */}
        <div className="lg:col-span-2 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-1">
            <Icons.MonitorUp className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">System update check & Version deployment</h4>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">Current build: <span className="font-mono text-[#8B5CF6]">{currentVersion}</span></div>
              <p className="text-[10px] text-[#A1A1AA] leading-relaxed">Released via git hub tags deployment pipeline hooks.</p>
            </div>

            {updateStatus === "idle" && (
              <button
                onClick={handleCheckUpdates}
                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold py-2.5 px-4.5 rounded-xl transition cursor-pointer"
              >
                Check for Updates
              </button>
            )}

            {updateStatus === "checking" && (
              <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Connecting to release server...</span>
              </div>
            )}

            {updateStatus === "update-available" && (
              <button
                onClick={handleDeployUpdate}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-2.5 px-4.5 rounded-xl transition cursor-pointer"
              >
                ⚡ Deploy Update v1.2.1
              </button>
            )}

            {updateStatus === "deploying" && (
              <div className="flex-1 w-full max-w-xs space-y-2">
                <div className="flex justify-between text-[10px] text-[#A1A1AA] font-mono">
                  <span>Downloading containers...</span>
                  <span>{deploymentProgress}%</span>
                </div>
                <div className="w-full bg-[#0B0B0F] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${deploymentProgress}%` }}></div>
                </div>
              </div>
            )}

            {updateStatus === "up-to-date" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
                <Icons.CheckCircle2 className="w-4 h-4" />
                <span>Fluxora platform is up to date</span>
              </div>
            )}
          </div>
        </div>

        {/* Data Privacy toggles */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-1">
            <Icons.EyeOff className="w-4.5 h-4.5 text-[#8B5CF6]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Data Privacy & Retention policy</h4>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1.5 font-bold">Purge analytics logs</label>
              <select
                value={retentionDays}
                onChange={e => {
                  setRetentionDays(e.target.value);
                  onNotify(`Data privacy policy: Retention interval changed to ${e.target.value} days`, "WARN");
                }}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-xs text-white p-2 rounded cursor-pointer focus:outline-none"
              >
                <option value="30">Purge telemetry older than 30 Days</option>
                <option value="90">Purge telemetry older than 90 Days</option>
                <option value="365">Purge telemetry older than 365 Days</option>
                <option value="never">Do not purge (keep raw logs)</option>
              </select>
            </div>

            <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1.5">
              <div className="pr-2">
                <span className="text-white font-medium block">GDPR Purge Compliance</span>
                <span className="text-[8px] text-[#A1A1AA]/50 font-normal leading-tight block">Automatically scrub private names/IP identifiers from telemetry events.</span>
              </div>
              <input
                type="checkbox"
                checked={gdprPurge}
                onChange={() => {
                  setGdprPurge(!gdprPurge);
                  onNotify(`GDPR compliancy filter is now ${!gdprPurge ? "active" : "inactive"}`, "WARN");
                }}
                className="rounded text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 bg-slate-900 border-white/[0.08] flex-shrink-0"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
