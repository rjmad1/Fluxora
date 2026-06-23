"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DomainScore {
  name: string;
  category: string;
  composite: number;
  authority: number;
  audienceRelevance: number;
  marketInterest: number;
  trend: number;
  strategicValue: number;
  growthPotential: string;
}

interface AuthorityMappingProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function AuthorityMapping({ onNotify }: AuthorityMappingProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>("AI & Machine Learning");
  const [domains, setDomains] = useState<DomainScore[]>([
    {
      name: "AI & Machine Learning",
      category: "Core Domain",
      composite: 88,
      authority: 92,
      audienceRelevance: 85,
      marketInterest: 94,
      trend: 89,
      strategicValue: 90,
      growthPotential: "Exponential - High search interest coupled with client demands.",
    },
    {
      name: "Product Management",
      category: "Core Domain",
      composite: 84,
      authority: 88,
      audienceRelevance: 91,
      marketInterest: 78,
      trend: 75,
      strategicValue: 86,
      growthPotential: "Steady - Strong baseline authority, high professional consistency.",
    },
    {
      name: "Distributed Systems & Telemetry",
      category: "Specialized Domain",
      composite: 90,
      authority: 95,
      audienceRelevance: 78,
      marketInterest: 88,
      trend: 96,
      strategicValue: 92,
      growthPotential: "Extreme - Algorithm changes driving telemetry integration demand.",
    },
    {
      name: "Enterprise Architecture",
      category: "Specialized Domain",
      composite: 76,
      authority: 81,
      audienceRelevance: 72,
      marketInterest: 68,
      trend: 74,
      strategicValue: 83,
      growthPotential: "Moderate - Stable advisory target, lower relative volume.",
    },
    {
      name: "Digital Transformation",
      category: "Advisory Domain",
      composite: 72,
      authority: 78,
      audienceRelevance: 80,
      marketInterest: 65,
      trend: 62,
      strategicValue: 77,
      growthPotential: "Decline - Saturated topic; advise highlighting case studies.",
    },
  ]);

  // Form for adding a domain
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainCat, setNewDomainCat] = useState("Specialized Domain");
  const [isAdding, setIsAdding] = useState(false);

  const activeDomain = domains.find((d) => d.name === selectedDomain) || domains[0];

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    if (domains.some((d) => d.name.toLowerCase() === newDomainName.trim().toLowerCase())) {
      onNotify("Domain already exists in your authority graph.", "WARN");
      return;
    }

    const randVal = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const auth = randVal(60, 95);
    const aud = randVal(60, 95);
    const mkt = randVal(60, 95);
    const trnd = randVal(60, 95);
    const strat = randVal(60, 95);
    const comp = Math.round((auth * 0.3) + (aud * 0.2) + (mkt * 0.1) + (trnd * 0.2) + (strat * 0.2));

    const newD: DomainScore = {
      name: newDomainName.trim(),
      category: newDomainCat,
      composite: comp,
      authority: auth,
      audienceRelevance: aud,
      marketInterest: mkt,
      trend: trnd,
      strategicValue: strat,
      growthPotential: "Pending verification - Autonomous analysis will enrich this path in 24 hours.",
    };

    setDomains([...domains, newD]);
    setSelectedDomain(newD.name);
    setNewDomainName("");
    setIsAdding(false);
    onNotify(`Added "${newD.name}" to your Authority Mapping Engine.`, "INFO");
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-[#8B5CF6]";
    return "text-amber-400";
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="border-b border-white/[0.04] pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Cpu className="w-5 h-5 text-[#8B5CF6]" />
            Personal Authority Mapping Engine
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Fluxora continuously maps your professional footprint. Focus your content strategy on domains where you possess verified credibility.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#8B5CF6] text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>Add Niche Domain</span>
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddDomain}
            className="p-4 bg-[#0B0B0F]/60 border border-white/[0.04] rounded-xl space-y-3 overflow-hidden"
          >
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Define New Target Domain</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Domain name (e.g. Supply Chain Optimization)"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                className="md:col-span-2 bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
              <select
                value={newDomainCat}
                onChange={(e) => setNewDomainCat(e.target.value)}
                className="bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-3 cursor-pointer focus:outline-none"
              >
                <option value="Core Domain">Core Domain</option>
                <option value="Specialized Domain">Specialized Domain</option>
                <option value="Advisory Domain">Advisory Domain</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A1A1AA] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition cursor-pointer"
              >
                Map Domain
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain List & Graph View */}
        <div className="lg:col-span-1 bg-[#0B0B0F]/30 border border-white/[0.04] p-4 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Positioning Graph</h4>
          <div className="space-y-2">
            {domains.map((dom) => {
              const isSelected = dom.name === selectedDomain;
              return (
                <button
                  key={dom.name}
                  type="button"
                  onClick={() => setSelectedDomain(dom.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer flex justify-between items-center ${
                    isSelected
                      ? "bg-[#7C3AED]/10 border-[#7C3AED]/40 text-white shadow-lg shadow-[#7C3AED]/5"
                      : "bg-[#0B0B0F]/60 border-white/[0.04] text-[#A1A1AA] hover:text-white hover:border-white/[0.08]"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold block mb-0.5 text-zinc-500">
                      {dom.category}
                    </span>
                    <h5 className="text-xs font-bold truncate">{dom.name}</h5>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-1">
                    <span className="text-[10px] text-zinc-500 font-mono">Composite</span>
                    <span className={`text-sm font-extrabold font-mono ${getScoreColor(dom.composite)}`}>
                      {dom.composite}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Domain Deep Dive Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Detailed metrics scores grid */}
          <div className="bg-[#0B0B0F]/45 border border-white/[0.04] p-5 rounded-xl space-y-6">
            <div className="flex justify-between items-start border-b border-white/[0.04] pb-4">
              <div>
                <span className="text-[9px] bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
                  {activeDomain.category}
                </span>
                <h4 className="text-lg font-bold text-white mt-1.5">{activeDomain.name}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#A1A1AA] block uppercase font-bold tracking-wider">Composite Authority</span>
                <span className={`text-3xl font-extrabold font-mono ${getScoreColor(activeDomain.composite)}`}>
                  {activeDomain.composite}
                </span>
              </div>
            </div>

            {/* Individual scores slider metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Authority Score", value: activeDomain.authority, tooltip: "Your expertise profile and published data index." },
                { label: "Audience Relevance", value: activeDomain.audienceRelevance, tooltip: "How closely this matches interests of targeted CTOs / leaders." },
                { label: "Market Interest", value: activeDomain.marketInterest, tooltip: "Aggregated global trend indices for this domain." },
                { label: "Trend Velocity", value: activeDomain.trend, tooltip: "Rate of engagement volume change over the last 7 days." },
                { label: "Strategic Value", value: activeDomain.strategicValue, tooltip: "Alignment with your business goals (authority building, jobs)." },
              ].map((s) => (
                <div key={s.label} className="space-y-1 bg-[#121218]/40 border border-white/[0.03] p-3 rounded-lg">
                  <div className="flex justify-between text-xs font-semibold text-[#A1A1AA]">
                    <span className="flex items-center gap-1">
                      {s.label}
                      <Icons.Info className="w-3.5 h-3.5 cursor-help text-[#A1A1AA]/50" title={s.tooltip} />
                    </span>
                    <span className="font-mono font-bold text-white">{s.value}</span>
                  </div>
                  {/* Progress bar visualizer */}
                  <div className="w-full bg-[#0B0B0F] h-1.5 rounded-full overflow-hidden border border-white/[0.08]">
                    <div
                      className="bg-gradient-to-r from-[#7C3AED] to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${s.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Qualitative analysis description */}
            <div className="pt-4 border-t border-white/[0.04] space-y-1.5">
              <h5 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Icons.Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Growth Vector Opportunity
              </h5>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {activeDomain.growthPotential} Fluxora recommends creating Educational case studies or Leadership points of view in this category to maximize algorithmic reach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
