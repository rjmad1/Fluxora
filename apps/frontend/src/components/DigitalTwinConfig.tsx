"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";

interface DigitalTwinConfigProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function DigitalTwinConfig({ onNotify }: DigitalTwinConfigProps) {
  const [formality, setFormality] = useState(0.6);
  const [creativity, setCreativity] = useState(0.75);
  const [toneInput, setToneInput] = useState("Technical, Direct, Visionary");
  const [writingStyle, setWritingStyle] = useState("Short paragraphs, Bullet points, Clear headings");
  const [preferredWords, setPreferredWords] = useState(["scale", "architecture", "isolation", "telemetry"]);
  const [avoidWords, setAvoidWords] = useState(["synergy", "paradigm shift", "game-changer"]);
  const [newWord, setNewWord] = useState("");
  const [wordType, setWordType] = useState<"preferred" | "avoid">("preferred");
  const [saving, setSaving] = useState(false);

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    if (wordType === "preferred") {
      if (!preferredWords.includes(newWord)) setPreferredWords([...preferredWords, newWord]);
    } else {
      if (!avoidWords.includes(newWord)) setAvoidWords([...avoidWords, newWord]);
    }
    setNewWord("");
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onNotify("AI Digital Twin Voice Profile updated successfully.", "AUDIT");
    }, 1000);
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="border-b border-white/[0.04] pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Cpu className="w-5 h-5 text-[#8B5CF6]" />
            AI Digital Twin Tuning
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-0.5">Refine how the AI Assistant generates copy. Tone guidelines directly impact system prompts.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 cursor-pointer"
        >
          {saving ? "Saving Changes..." : "Save Configuration"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sliders & Fields */}
        <div className="space-y-5">
          {/* Sliders */}
          <div className="space-y-4 bg-[#0B0B0F]/45 border border-white/[0.04] p-4 rounded-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Model Parameters</h4>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#A1A1AA]">
                <span>Formality Level</span>
                <span className="font-mono text-[#8B5CF6] font-semibold">{formality}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formality}
                onChange={(e) => setFormality(parseFloat(e.target.value))}
                className="w-full accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[9px] text-[#A1A1AA]/50 font-mono">
                <span>Conversational</span>
                <span>Corporate</span>
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <div className="flex justify-between text-xs text-[#A1A1AA]">
                <span>Creativity Index</span>
                <span className="font-mono text-[#8B5CF6] font-semibold">{creativity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={creativity}
                onChange={(e) => setCreativity(parseFloat(e.target.value))}
                className="w-full accent-[#7C3AED]"
              />
              <div className="flex justify-between text-[9px] text-[#A1A1AA]/50 font-mono">
                <span>Deterministic</span>
                <span>Creative / Novel</span>
              </div>
            </div>
          </div>

          {/* Form inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase text-[#A1A1AA] block mb-1.5 font-bold tracking-wider">Voice Tone Adjectives</label>
              <input
                type="text"
                value={toneInput}
                onChange={(e) => setToneInput(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase text-[#A1A1AA] block mb-1.5 font-bold tracking-wider">Formatting & Writing Style</label>
              <input
                type="text"
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
          </div>
        </div>

        {/* Vocabulary lists */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4 bg-[#0B0B0F]/45 border border-white/[0.04] p-4 rounded-xl flex-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Vocabulary Controls</h4>
            
            {/* Word lists */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mb-1.5">Preferred Vocabularies</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferredWords.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-semibold rounded-md flex items-center gap-1"
                    >
                      {w}
                      <button onClick={() => setPreferredWords(preferredWords.filter((x) => x !== w))} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1.5">Restricted Vocabularies (Avoid)</p>
                <div className="flex flex-wrap gap-1.5">
                  {avoidWords.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold rounded-md flex items-center gap-1"
                    >
                      {w}
                      <button onClick={() => setAvoidWords(avoidWords.filter((x) => x !== w))} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Ingress word */}
            <div className="flex gap-2 mt-6">
              <input
                type="text"
                placeholder="Enter word..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="flex-1 bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
              <select
                value={wordType}
                onChange={(e: any) => setWordType(e.target.value)}
                className="bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2 cursor-pointer"
              >
                <option value="preferred">Prefer</option>
                <option value="avoid">Avoid</option>
              </select>
              <button
                onClick={handleAddWord}
                className="bg-[#181821] hover:bg-white/[0.04] border border-white/[0.08] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Twin Prompt Live Sandbox */}
          <div className="bg-[#121218]/80 border border-white/[0.08] p-4 rounded-xl space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider flex items-center gap-1">
              <Icons.Terminal className="w-3.5 h-3.5 text-[#8B5CF6]" />
              Twin Context Prompt Sandbox (Live)
            </h4>
            <div className="bg-[#0B0B0F] p-3 rounded-lg font-mono text-[10px] text-[#A1A1AA] leading-relaxed max-h-[120px] overflow-y-auto">
              System Instruction: You are the AI Digital Twin of the user. Tone is "{toneInput}", format is "{writingStyle}". Avoid keywords: "{avoidWords.join(", ")}". Preferred terminology: "{preferredWords.join(", ")}". Formality={formality}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
