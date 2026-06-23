"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

interface DraftVersion {
  id: string;
  timestamp: string;
  content: string;
}

export default function AIContentStudio() {
  const {
    composerContent,
    setComposerContent,
    scheduledAt,
    setScheduledAt,
    staggerMinutes,
    setStaggerMinutes,
    selectedChannels,
    setSelectedChannels,
    setActivityLogs
  } = useAppContext();

  // Mode settings
  const [formality, setFormality] = useState(0.6);
  const [creativity, setCreativity] = useState(0.7);
  const [toneMode, setToneMode] = useState<"technical" | "executive" | "storytelling" | "educational">("technical");

  // Drafts & versions state
  const [drafts, setDrafts] = useState<DraftVersion[]>([
    { id: "v1", timestamp: "14:10", content: "Excited to share our Clickhouse database scaling framework! 🚀 #databases #scale" },
    { id: "v2", timestamp: "14:15", content: "Decoupled telemetry streams are essential. Shifting ingestion events through Kafka queues to ClickHouse OLAP databases reduced latency to <1.5s! #scaling #infrastructure" }
  ]);

  const [savingDraft, setSavingDraft] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Quality scores
  const [scores, setScores] = useState({
    humanVoice: 82,
    educational: 85,
    authority: 90,
    engagement: 78,
    readability: 88,
    credibility: 85,
    originality: 80
  });

  // Humanization & optimization reports
  const [violations, setViolations] = useState<string[]>([]);
  const [optimizations, setOptimizations] = useState<string[]>([]);

  // Local notify function
  const notify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg }
    ]);
  };

  function runComplianceCheck(text: string) {
    const newViolations: string[] = [];
    const newOptimizations: string[] = [];

    if (!text.trim()) {
      setViolations([]);
      setOptimizations([]);
      return;
    }

    // Humanization checks
    if (text.includes("—") || text.includes("--")) {
      newViolations.push("Avoid em-dashes (—). Standardize with commas or colons for a natural tone.");
    }
    const buzzwords = ["synergy", "paradigm shift", "game-changer", "transformative", "cutting-edge", "revolutionary"];
    buzzwords.forEach((word) => {
      if (text.toLowerCase().includes(word)) {
        newViolations.push(`Contains corporate cliché: "${word}". Replace with straightforward language.`);
      }
    });

    if (text.length < 800) {
      newOptimizations.push("LinkedIn length check: Content is under 800 chars. Consider expanding with case study detail.");
    } else if (text.length > 1800) {
      newOptimizations.push("LinkedIn length check: Content exceeds 1800 chars. Condense to keep readers engaged on mobile feeds.");
    }

    // Readability & spacing checks
    const paragraphs = text.split("\n").filter((p) => p.trim());
    const longParagraph = paragraphs.some((p) => p.length > 250);
    if (longParagraph) {
      newOptimizations.push("Paragraph length: Some blocks exceed 250 chars. Break them into smaller 2-3 line segments to enhance mobile readability.");
    }

    // Hook check
    const firstLine = text.split("\n")[0] || "";
    if (firstLine.length > 60) {
      newOptimizations.push("Hook quality: First line is too long. Shorten it to under 50 characters to grab attention before visual 'see more' cutoff.");
    }

    // CTA check
    if (!text.toLowerCase().includes("comment") && !text.toLowerCase().includes("share") && !text.toLowerCase().includes("link")) {
      newOptimizations.push("Missing CTA: Add a question or call-to-action to spark discussion in the comments section.");
    }

    setViolations(newViolations);
    setOptimizations(newOptimizations);

    // Recalculate scores heuristic
    const scoreDeductions = newViolations.length * 8 + newOptimizations.length * 4;
    setScores({
      humanVoice: Math.max(50, 95 - newViolations.length * 10),
      educational: text.length > 500 ? 90 : 70,
      authority: text.toLowerCase().includes("decoupled") || text.toLowerCase().includes("database") ? 92 : 75,
      engagement: Math.max(40, 88 - scoreDeductions),
      readability: longParagraph ? 65 : 94,
      credibility: text.includes("#") ? 88 : 78,
      originality: Math.max(50, 92 - newViolations.length * 5)
    });
  }

  // Run checks whenever content changes
  useEffect(() => {
    runComplianceCheck(composerContent);
  }, [composerContent]);

  const handleAiAction = (action: "expand" | "condense" | "humanize") => {
    setAnalyzing(true);
    notify(`AI Content Studio: running rewrite action "${action}"`, "INFO");

    setTimeout(() => {
      let nextContent = composerContent;
      if (action === "expand") {
        nextContent = `${composerContent}\n\nKey execution details:\n- Telemetry batch insertion is throttled in Kafka clusters to limit SQL thread contention.\n- ClickHouse analytics queries aggregation runs on partitioned workspace boundaries.\n- Local fallback JSON databases permit offline execution testing in sandboxes.`;
      } else if (action === "condense") {
        nextContent = `Decoupling analytics from Postgres using Kafka streams to ClickHouse reduced telemetry latency to <1.5s. RLS security rules are preserved. #telemetry #data #databases`;
      } else {
        // Humanize: remove clichés, format spacing
        let text = composerContent;
        text = text.replace(/—/g, ", ").replace(/game-changer/g, "practical framework").replace(/paradigm shift/g, "architecture shift");
        nextContent = text;
      }

      setComposerContent(nextContent);
      setAnalyzing(false);
      notify(`AI Content Studio: Completed "${action}" rewrite optimization.`, "AUDIT");
    }, 1000);
  };

  const handleSaveDraft = () => {
    if (!composerContent.trim()) return;
    setSavingDraft(true);
    setTimeout(() => {
      const newD: DraftVersion = {
        id: `v-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
        content: composerContent
      };
      setDrafts([newD, ...drafts]);
      setSavingDraft(false);
      notify("Saved draft version into local workspace history.", "INFO");
    }, 800);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    notify("Omnichannel scheduling triggered via unified composer.", "AUDIT");
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="border-b border-white/[0.04] pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Sparkles className="w-5.5 h-5.5 text-[#8B5CF6]" />
            AI Content Studio
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Optimize your narrative voice, validate compliance rules, and evaluate visual score meters.
          </p>
        </div>
        <button
          onClick={handleSaveDraft}
          disabled={savingDraft || !composerContent.trim()}
          className="bg-[#121218] hover:bg-white/[0.02] border border-white/[0.08] text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 cursor-pointer"
        >
          {savingDraft ? "Saving..." : "Save Draft version"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Draft Versions Sidebar (3/12 cols) */}
        <div className="lg:col-span-3 bg-[#0B0B0F]/30 border border-white/[0.04] p-4 rounded-xl space-y-4 flex flex-col h-[560px]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <Icons.History className="w-3.5 h-3.5 text-zinc-500" />
            <span>Version History</span>
          </h4>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {drafts.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setComposerContent(d.content)}
                className="w-full text-left p-2.5 bg-[#0B0B0F]/60 border border-white/[0.04] hover:border-[#8B5CF6]/35 rounded-xl transition text-xs space-y-1 block cursor-pointer"
              >
                <span className="text-[9px] font-mono text-[#8B5CF6] block">{d.timestamp}</span>
                <p className="text-[#A1A1AA] line-clamp-2 leading-relaxed">{d.content}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Editor Area (6/12 cols) */}
        <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Tone selector toolbar */}
            <div className="flex justify-between items-center bg-[#0B0B0F] border border-white/[0.08] p-1.5 rounded-xl text-xs">
              <span className="text-[#A1A1AA] pl-1 text-[10px] font-bold uppercase tracking-wide">Tone mode:</span>
              <div className="flex gap-1">
                {(["technical", "executive", "storytelling", "educational"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setToneMode(mode);
                      if (mode === "technical") { setFormality(0.85); setCreativity(0.5); }
                      else if (mode === "executive") { setFormality(0.9); setCreativity(0.6); }
                      else if (mode === "storytelling") { setFormality(0.45); setCreativity(0.85); }
                      else { setFormality(0.6); setCreativity(0.7); }
                    }}
                    className={`px-2 py-1 rounded text-[10px] capitalize font-semibold transition cursor-pointer ${
                      toneMode === mode ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Rich text formatting tools */}
            <div className="flex items-center gap-2 bg-[#0B0B0F]/40 border border-white/[0.04] p-2 rounded-xl text-zinc-400">
              <button
                type="button"
                onClick={() => notify("Formatting: Bold markup applied.", "INFO")}
                className="p-1 hover:bg-white/[0.04] rounded hover:text-white"
                title="Bold"
              >
                <Icons.Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => notify("Formatting: Italic markup applied.", "INFO")}
                className="p-1 hover:bg-white/[0.04] rounded hover:text-white"
                title="Italic"
              >
                <Icons.Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => notify("Formatting: Bullet list template applied.", "INFO")}
                className="p-1 hover:bg-white/[0.04] rounded hover:text-white"
                title="Bullet List"
              >
                <Icons.List className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-white/[0.08]" />
              <button
                type="button"
                onClick={() => handleAiAction("expand")}
                disabled={analyzing}
                className="px-2 py-0.5 hover:bg-[#8B5CF6]/15 hover:text-[#8B5CF6] text-[10px] font-bold uppercase rounded border border-transparent hover:border-[#8B5CF6]/20 transition flex items-center gap-1"
                title="AI Expand"
              >
                <Icons.PlusSquare className="w-3.5 h-3.5" />
                <span>Expand</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiAction("condense")}
                disabled={analyzing}
                className="px-2 py-0.5 hover:bg-[#8B5CF6]/15 hover:text-[#8B5CF6] text-[10px] font-bold uppercase rounded border border-transparent hover:border-[#8B5CF6]/20 transition flex items-center gap-1"
                title="AI Condense"
              >
                <Icons.MinusSquare className="w-3.5 h-3.5" />
                <span>Condense</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiAction("humanize")}
                disabled={analyzing}
                className="px-2 py-0.5 hover:bg-emerald-500/10 hover:text-emerald-400 text-[10px] font-bold uppercase rounded border border-transparent hover:border-emerald-500/20 transition flex items-center gap-1"
                title="Humanize"
              >
                <Icons.UserCheck className="w-3.5 h-3.5" />
                <span>Humanize</span>
              </button>
            </div>

            {/* Editor Workspace Textarea */}
            <div className="relative">
              <textarea
                value={composerContent}
                onChange={(e) => setComposerContent(e.target.value)}
                placeholder="Compose your narrative text..."
                className="w-full h-72 bg-[#0B0B0F] border border-white/[0.08] rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
              />
              <span className="absolute bottom-3 right-3 text-[9px] text-[#A1A1AA]/60 font-mono">
                {composerContent.length} characters
              </span>
            </div>
          </div>

          {/* Prompt Tuning Params Slider panel */}
          <div className="bg-[#0B0B0F]/20 border border-white/[0.04] p-4 rounded-xl grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-[#A1A1AA] uppercase">
                <span>Formality Index</span>
                <span className="font-mono text-[#8B5CF6]">{formality}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formality}
                onChange={(e) => setFormality(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#121218] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-[#A1A1AA] uppercase">
                <span>Creativity Index</span>
                <span className="font-mono text-[#8B5CF6]">{creativity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={creativity}
                onChange={(e) => setCreativity(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#121218] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Score Card & Compliance (3/12 cols) */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto max-h-[560px] pr-1">
          {/* Scoring panel */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4.5 shadow-xl space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Icons.Award className="w-4 h-4 text-[#8B5CF6]" />
              <span>Narrative Quality Scores</span>
            </h4>

            <div className="space-y-3 text-xs font-mono">
              {[
                { label: "Human Voice", val: scores.humanVoice },
                { label: "Educational", val: scores.educational },
                { label: "Authority Match", val: scores.authority },
                { label: "Expected Engagement", val: scores.engagement },
                { label: "Readability Index", val: scores.readability },
                { label: "Credibility Ratio", val: scores.credibility },
                { label: "Originality Ratio", val: scores.originality }
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[#A1A1AA]">
                    <span>{s.label}</span>
                    <strong className="text-white font-bold">{s.val}%</strong>
                  </div>
                  <div className="w-full bg-[#0B0B0F] h-1 rounded-full overflow-hidden border border-white/[0.08]">
                    <div
                      className="bg-gradient-to-r from-[#7C3AED] to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${s.val}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance warnings panel */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4.5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Icons.ShieldAlert className="w-4 h-4 text-[#8B5CF6]" />
              <span>Compliance & Optimization</span>
            </h4>

            {/* Red / Yellow Alert Lists */}
            <div className="space-y-2 text-[10px] leading-relaxed">
              {violations.map((v, i) => (
                <p key={i} className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex gap-1.5 items-start">
                  <Icons.AlertOctagon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-400" />
                  <span>{v}</span>
                </p>
              ))}

              {optimizations.map((o, i) => (
                <p key={i} className="text-yellow-300 bg-yellow-500/5 border border-yellow-500/15 p-2.5 rounded-xl flex gap-1.5 items-start">
                  <Icons.AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-yellow-400" />
                  <span>{o}</span>
                </p>
              ))}

              {violations.length === 0 && optimizations.length === 0 && (
                <div className="text-center py-6 text-zinc-500 italic flex flex-col items-center gap-1.5">
                  <Icons.CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>All compliance rules validated. Content is optimized for LinkedIn.</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
