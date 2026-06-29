"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Variation {
  id: string;
  text: string;
  tone: string;
  hashtags: string[];
}

interface AIContentAssistantProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
  onSendToComposer?: (content: string) => void;
}

export default function AIContentAssistant({ onNotify, onSendToComposer }: AIContentAssistantProps) {
  const [prompt, setPrompt] = useState("Explain how decoupled observability telemetry runs faster using ClickHouse and Kafka");
  const [activeTone, setActiveTone] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([
    {
      id: "var-1",
      tone: "Professional",
      text: "Fluxora decodes enterprise scaling by streaming observability telemetry logs through Kafka straight to ClickHouse. Aggregations finish under 500ms, removing bottlenecks from core relational stores like PostgreSQL. 🚀 Data boundary integrity remains fully isolated.",
      hashtags: ["#dataarchitecture", "#telemetry", "#clickhouse", "#scaling"]
    }
  ]);
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([
    "#telemetry", "#clickhouse", "#kafka", "#saas", "#scaling", "#architecture", "#eventsourcing", "#database"
  ]);

  // Generate Caption variations
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    onNotify(`AI Assistant: Generating variations for prompt: "${prompt.slice(0, 30)}..."`, "INFO");

    try {
      const res = await fetch("http://localhost:3000/api/v1/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ prompt, tone: activeTone, hashtags: generatedHashtags })
      });
      
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      
      const vars: Variation[] = [
        {
          id: `var-1-${Date.now()}`,
          tone: activeTone,
          text: data.content || "Generation failed.",
          hashtags: generatedHashtags,
        }
      ];
      setVariations(vars);

      // Update hashtag recommendations
      const newTags = prompt.toLowerCase().includes("observability")
        ? ["#observability", "#telemetry", "#realtime", "#monitoring", "#sysadmin", "#cloudscale"]
        : ["#startups", "#indiehackers", "#marketing", "#distribution", "#growthhacking"];
      setGeneratedHashtags(newTags);

      onNotify("AI Assistant: Caption variations ready", "INFO");
    } catch (err) {
      console.error(err);
      onNotify("AI Assistant: Failed to generate content", "WARN");
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine text operations (Shorten, Refine, Add Emojis)
  const handleRefine = async (id: string, action: "shorten" | "expand" | "emojis") => {
    const variant = variations.find((v) => v.id === id);
    if (!variant) return;

    onNotify(`AI Assistant: Refining variant...`, "INFO");

    try {
      const res = await fetch("http://localhost:3000/api/v1/ai/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ content: variant.text, action })
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();

      setVariations((prev) =>
        prev.map((v) => {
          if (v.id !== id) return v;
          return { ...v, text: data.content || v.text };
        })
      );
      onNotify(`AI Assistant: Successfully applied action "${action}"`, "INFO");
    } catch (err) {
      console.error(err);
      onNotify(`AI Assistant: Failed to refine variant`, "WARN");
    }
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white">AI Content Assistant</h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Generate, refine, and adapt social copy with brand voice controls.</p>
        </div>
        <Icons.Sparkles className="w-5 h-5 text-[#8B5CF6]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Column */}
        <div className="space-y-4">
          {/* Prompt Box */}
          <form onSubmit={handleGenerate} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block mb-1">Generate Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe what you want to post about..."
                className="w-full h-24 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                required
              />
            </div>

            {/* Tone Selection Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block">Tone of Voice</label>
              <div className="grid grid-cols-2 gap-2">
                {["Professional", "Casual", "Witty", "Creative"].map(tone => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setActiveTone(tone)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      activeTone === tone
                        ? "bg-[#7C3AED]/20 text-white border-[#7C3AED]/40"
                        : "bg-[#0B0B0F]/65 border-white/[0.04] text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition cursor-pointer"
            >
              {isGenerating ? "Drafting captions..." : "✨ Generate Social Copy"}
            </button>
          </form>

          {/* Hashtag Suggestion Panel */}
          <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Icons.Hash className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Recommended Hashtags</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {generatedHashtags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setPrompt(prev => prev + " " + tag);
                    onNotify(`Appended hashtag "${tag}" to prompt`, "INFO");
                  }}
                  className="px-2.5 py-1 bg-[#121218] hover:bg-[#181821] border border-white/[0.06] hover:border-[#7C3AED]/30 rounded-full text-[10px] text-[#A1A1AA] hover:text-white transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-[#A1A1AA]/60">Click chips to append tags into prompt console.</p>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">AI Generated Caption Variations</h4>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {variations.map((v, idx) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#0B0B0F]/50 border border-white/[0.06] rounded-xl p-4.5 space-y-3 relative group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">
                      Variation #{idx + 1} • {v.tone}
                    </span>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefine(v.id, "shorten")}
                        className="text-[9px] text-[#A1A1AA] hover:text-white border border-white/[0.06] px-2 py-1 rounded transition cursor-pointer"
                        title="Shorten text"
                      >
                        Shorten
                      </button>
                      <button
                        onClick={() => handleRefine(v.id, "expand")}
                        className="text-[9px] text-[#A1A1AA] hover:text-white border border-white/[0.06] px-2 py-1 rounded transition cursor-pointer"
                        title="Expand details"
                      >
                        Refine
                      </button>
                      <button
                        onClick={() => handleRefine(v.id, "emojis")}
                        className="text-[9px] text-[#A1A1AA] hover:text-white border border-white/[0.06] px-2 py-1 rounded transition cursor-pointer"
                        title="Add emojis"
                      >
                        ✨ Style
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{v.text}</p>

                  <div className="flex flex-wrap gap-1">
                    {v.hashtags.map(t => (
                      <span key={t} className="text-[9px] text-[#8B5CF6] font-medium mr-1.5">{t}</span>
                    ))}
                  </div>

                  <div className="border-t border-white/[0.04] pt-3 flex justify-between items-center">
                    <span className="text-[10px] text-[#A1A1AA]">Ready to schedule?</span>
                    <button
                      onClick={() => {
                        const copyText = v.text + " " + v.hashtags.join(" ");
                        navigator.clipboard.writeText(copyText);
                        onNotify("Copied variation to clipboard", "INFO");
                        if (onSendToComposer) {
                          onSendToComposer(copyText);
                        } else {
                          alert("Caption text copied! Paste it in the publishing composer drawer.");
                        }
                      }}
                      className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <Icons.Copy className="w-3.5 h-3.5" />
                      <span>Use Variation</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
