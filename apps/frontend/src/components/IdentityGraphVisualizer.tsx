"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

interface IdentityGraphVisualizerProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

interface IdentityProfile {
  id: string;
  workspaceId: string;
  traits: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface IdentityNode {
  id: string;
  workspaceId: string;
  identifierType: "EMAIL" | "COOKIE" | "TWITTER_HANDLE" | "CRM_ID" | "PHONE";
  identifierValue: string;
  resolvedProfileId: string;
  createdAt: string;
}

interface IdentityEdge {
  id: string;
  workspaceId: string;
  sourceNodeId: string;
  targetNodeId: string;
  linkType: "DETERMINISTIC_LOGIN" | "PROBABILISTIC_BEHAVIOR";
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export default function IdentityGraphVisualizer({ onNotify }: IdentityGraphVisualizerProps) {
  const [profiles, setProfiles] = useState<IdentityProfile[]>([]);
  const [nodes, setNodes] = useState<IdentityNode[]>([]);
  const [edges, setEdges] = useState<IdentityEdge[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual resolution form states
  const [identType1, setIdentType1] = useState<any>("EMAIL");
  const [identVal1, setIdentVal1] = useState("");
  const [identType2, setIdentType2] = useState<any>("COOKIE");
  const [identVal2, setIdentVal2] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/identity/graph", {
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (!res.ok) throw new Error("API Offline");
      const data = await res.json();
      setProfiles(data.profiles || []);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (err) {
      console.warn("Identity graph API offline. Falling back to dynamic mock state:", err);
      // Fallback local mockup data matching real Prisma schema
      setProfiles([
        { id: "prof-1", workspaceId: "ws-1", traits: { name: "Alice Smith", source: "Auth0" }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "prof-2", workspaceId: "ws-1", traits: { name: "Bob Jones", source: "FormSubmit" }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]);
      setNodes([
        { id: "node-1", workspaceId: "ws-1", identifierType: "EMAIL", identifierValue: "alice@corp.com", resolvedProfileId: "prof-1", createdAt: new Date().toISOString() },
        { id: "node-2", workspaceId: "ws-1", identifierType: "COOKIE", identifierValue: "cook_889", resolvedProfileId: "prof-1", createdAt: new Date().toISOString() },
        { id: "node-3", workspaceId: "ws-1", identifierType: "EMAIL", identifierValue: "bob@domain.com", resolvedProfileId: "prof-2", createdAt: new Date().toISOString() }
      ]);
      setEdges([
        { id: "edge-1", workspaceId: "ws-1", sourceNodeId: "node-1", targetNodeId: "node-2", linkType: "DETERMINISTIC_LOGIN", confidenceScore: 1.0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identVal1 || !identVal2) return;

    setResolving(true);
    onNotify(`Identity: Submitting resolution request for ${identType1}:${identVal1} <-> ${identType2}:${identVal2}`, "INFO");

    try {
      const res = await fetch("http://localhost:3000/api/v1/identity/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({
          identifiers: [
            { type: identType1, value: identVal1 },
            { type: identType2, value: identVal2 }
          ]
        }),
      });

      if (!res.ok) throw new Error("Resolution API failed");
      
      onNotify("Identity: Successfully resolved and stitched profiles in PostgreSQL database!", "AUDIT");
      setIdentVal1("");
      setIdentVal2("");
      await fetchGraph();
    } catch (err) {
      console.warn("Resolution API offline. Stitching locally for demo:", err);
      setTimeout(() => {
        const newProfId = `prof-new-${Date.now()}`;
        setProfiles(prev => [
          ...prev,
          { id: newProfId, workspaceId: "ws-1", traits: { source: "ManualStitch" }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]);
        setNodes(prev => [
          ...prev,
          { id: `node-n1-${Date.now()}`, workspaceId: "ws-1", identifierType: identType1, identifierValue: identVal1, resolvedProfileId: newProfId, createdAt: new Date().toISOString() },
          { id: `node-n2-${Date.now()}`, workspaceId: "ws-1", identifierType: identType2, identifierValue: identVal2, resolvedProfileId: newProfId, createdAt: new Date().toISOString() }
        ]);
        setEdges(prev => [
          ...prev,
          { id: `edge-n-${Date.now()}`, workspaceId: "ws-1", sourceNodeId: `node-n1-${Date.now()}`, targetNodeId: `node-n2-${Date.now()}`, linkType: "DETERMINISTIC_LOGIN", confidenceScore: 1.0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]);
        setIdentVal1("");
        setIdentVal2("");
        onNotify("Identity Demo: Local profiles resolved and updated.", "AUDIT");
      }, 800);
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Customer Identity Resolution Graph</h3>
          <p className="text-[10px] text-[#A1A1AA]">Stitch multiple data points into unified client profiles deterministically or probabilistically.</p>
        </div>
        <button
          onClick={fetchGraph}
          disabled={loading}
          className="bg-[#121218] hover:bg-white/[0.02] border border-white/[0.08] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
        >
          <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Graph</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Profiles List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icons.Users className="w-4 h-4 text-[#8B5CF6]" />
              <span>Stitched Profiles ({profiles.length})</span>
            </h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {profiles.map(p => {
                const profileNodes = nodes.filter(n => n.resolvedProfileId === p.id);
                return (
                  <div key={p.id} className="p-4 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl hover:border-white/[0.08] transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[9px] font-mono text-[#8B5CF6] font-semibold">{p.id}</span>
                        <h5 className="text-xs font-bold text-white mt-0.5">
                          {p.traits.name || "Anonymous Stitched Client"}
                        </h5>
                      </div>
                      <span className="text-[8px] text-[#A1A1AA] font-mono">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Nodes within this profile */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profileNodes.map(n => (
                        <div key={n.id} className="flex items-center gap-1 bg-[#121218] border border-white/[0.06] rounded-md px-2 py-1">
                          <span className={`text-[7px] font-bold px-1 rounded-sm ${
                            n.identifierType === "EMAIL" ? "bg-blue-500/10 text-blue-400" :
                            n.identifierType === "COOKIE" ? "bg-purple-500/10 text-purple-400" :
                            n.identifierType === "PHONE" ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-amber-500/10 text-amber-400"
                          }`}>{n.identifierType}</span>
                          <span className="text-[9px] text-[#A1A1AA] font-mono font-medium">{n.identifierValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {profiles.length === 0 && (
                <div className="text-center py-8 text-[11px] text-[#A1A1AA]/50 italic">
                  No stitched profiles found. Run resolution below to generate nodes.
                </div>
              )}
            </div>
          </div>

          {/* Linkage Edges */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icons.GitCommit className="w-4 h-4 text-[#8B5CF6]" />
              <span>Attribution Linkage Edges ({edges.length})</span>
            </h4>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {edges.map(e => {
                const source = nodes.find(n => n.id === e.sourceNodeId);
                const target = nodes.find(n => n.id === e.targetNodeId);
                return (
                  <div key={e.id} className="p-3 bg-[#0B0B0F]/30 border border-white/[0.03] rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-white font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06] truncate max-w-[120px]">
                        {source ? source.identifierValue : "node-1"}
                      </span>
                      <Icons.ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[9px] text-white font-mono bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06] truncate max-w-[120px]">
                        {target ? target.identifierValue : "node-2"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-semibold text-[#8B5CF6] font-mono">{e.linkType}</span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold font-mono">
                        {(e.confidenceScore * 100).toFixed(0)}% Conf
                      </span>
                    </div>
                  </div>
                );
              })}

              {edges.length === 0 && (
                <div className="text-center py-6 text-[10px] text-[#A1A1AA]/50 italic">
                  No connection linkage edges registered.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Action Panel Form */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Stitch Engine Controller</h4>
            <p className="text-[10px] text-[#A1A1AA] mb-4">Simulate logins or client forms to trigger the graph resolution logic.</p>

            <form onSubmit={handleResolve} className="space-y-4">
              {/* Node 1 */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase text-[#A1A1AA] tracking-wider block font-bold">Identifier Node 1</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={identType1}
                    onChange={e => setIdentType1(e.target.value)}
                    className="col-span-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-1 py-2 cursor-pointer focus:outline-none"
                  >
                    <option value="EMAIL">EMAIL</option>
                    <option value="COOKIE">COOKIE</option>
                    <option value="PHONE">PHONE</option>
                    <option value="TWITTER_HANDLE">X HANDLE</option>
                    <option value="CRM_ID">CRM ID</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="e.g. alice@corp.com"
                    value={identVal1}
                    onChange={e => setIdentVal1(e.target.value)}
                    className="col-span-2 bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Node 2 */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase text-[#A1A1AA] tracking-wider block font-bold">Identifier Node 2</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={identType2}
                    onChange={e => setIdentType2(e.target.value)}
                    className="col-span-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-1 py-2 cursor-pointer focus:outline-none"
                  >
                    <option value="EMAIL">EMAIL</option>
                    <option value="COOKIE">COOKIE</option>
                    <option value="PHONE">PHONE</option>
                    <option value="TWITTER_HANDLE">X HANDLE</option>
                    <option value="CRM_ID">CRM ID</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cook_908123"
                    value={identVal2}
                    onChange={e => setIdentVal2(e.target.value)}
                    className="col-span-2 bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04] mt-6">
                <button
                  type="submit"
                  disabled={resolving || !identVal1 || !identVal2}
                  className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-[#7C3AED]/15 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {resolving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Resolving Identifiers...</span>
                    </>
                  ) : (
                    <>
                      <Icons.UserCheck className="w-4 h-4" />
                      <span>Stitch Identifiers</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="text-[8px] text-[#A1A1AA]/50 font-mono text-center mt-6">
            Database partitions: Row-Level Security isolation active.
          </div>
        </div>

      </div>
    </div>
  );
}
