"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UGCVideoDashboardProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

const TEMPLATES = [
  {
    name: "Hook-Story-Offer",
    text: "Hook: Stop wasting 10 hours a week on social media posting.\nStory: We built a fully automated publisher that schedules, targets, and tracks everything. It streams data in real-time from Kafka to ClickHouse.\nOffer: Sign up today and get your first 30 days completely free!"
  },
  {
    name: "Problem-Agitate-Solve",
    text: "Problem: Analytics dashboards are slow and frustrating.\nAgitate: Waiting 10 seconds for a chart to load ruins your team's workflow and slows down decision making.\nSolve: Fluxora uses sub-second ClickHouse data aggregation to sync telemetry in real-time. Instantly responsive!"
  },
  {
    name: "Feature Highlight",
    text: "Introducing our new Digital Twin agent! It learns your brand's unique tone of voice, adapts styling per platform, and suggests high-engagement tags automatically. It's like having a team of social media experts working 24/7."
  }
];

const AVATARS = [
  { id: "Sophia", name: "Sophia", role: "Tech Advocate", gender: "Female", color: "from-purple-500 to-indigo-500" },
  { id: "Marcus", name: "Marcus", role: "Startup Founder", gender: "Male", color: "from-blue-500 to-cyan-500" },
  { id: "Elena", name: "Elena", role: "Creative Lead", gender: "Female", color: "from-pink-500 to-rose-500" },
  { id: "David", name: "David", role: "Finance Analyst", gender: "Male", color: "from-emerald-500 to-teal-500" }
];

const STYLES = [
  { id: "Neon-Tech", name: "Neon Tech", border: "border-purple-500", bg: "from-purple-900/40 to-indigo-900/40 text-purple-400" },
  { id: "Retro-Synth", name: "Retro Synth", border: "border-pink-500", bg: "from-pink-900/40 to-rose-900/40 text-pink-400" },
  { id: "Minimal-Clean", name: "Minimal Clean", border: "border-white", bg: "from-zinc-900/40 to-stone-900/40 text-zinc-200" },
  { id: "Cyberpunk-Dark", name: "Cyberpunk Dark", border: "border-yellow-500", bg: "from-yellow-900/40 to-amber-900/40 text-yellow-400" }
];

export default function UGCVideoDashboard({ onNotify }: UGCVideoDashboardProps) {
  const [script, setScript] = useState(TEMPLATES[0].text);
  const [aspectRatio, setAspectRatio] = useState<"portrait" | "square" | "landscape">("portrait");
  const [selectedStyle, setSelectedStyle] = useState("Neon-Tech");
  const [selectedAvatar, setSelectedAvatar] = useState("Sophia");
  const [voiceProfile, setVoiceProfile] = useState("Nova");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [captionFont, setCaptionFont] = useState("Inter");
  const [captionSize, setCaptionSize] = useState<"sm" | "md" | "lg">("md");
  const [captionPosition, setCaptionPosition] = useState<"top" | "middle" | "bottom">("bottom");
  const [captionStyle, setCaptionStyle] = useState<"karaoke" | "glow" | "classic">("karaoke");

  // Rendering States
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStep, setRenderStep] = useState("");
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  // Subtitle playback state simulation
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCaptionIdx, setCurrentCaptionIdx] = useState(0);

  const sentences = script.split(/[.\n]/).filter(s => s.trim().length > 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && sentences.length > 0) {
      interval = setInterval(() => {
        setCurrentCaptionIdx((prev) => (prev + 1) % sentences.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sentences.length]);

  const handleTemplateSelect = (text: string) => {
    setScript(text);
    onNotify("UGC Video: Loaded script template", "INFO");
  };

  const handleRender = () => {
    if (!script.trim()) {
      onNotify("UGC Video: Cannot render empty script", "WARN");
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setRenderedVideoUrl(null);
    setIsPlaying(false);
    onNotify("UGC Video: Synthesizing AI presenter and voice profile...", "INFO");

    const steps = [
      { progress: 15, msg: "Parsing script elements..." },
      { progress: 35, msg: "Generating synthetic voice output..." },
      { progress: 60, msg: "Synthesizing facial mesh & lip sync..." },
      { progress: 85, msg: "Overlaying subtitles and filters..." },
      { progress: 100, msg: "Rendering final video stream..." }
    ];

    let currentStepIdx = 0;
    const progressTimer = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setRenderProgress(step.progress);
        setRenderStep(step.msg);
        currentStepIdx++;
      } else {
        clearInterval(progressTimer);
        setIsRendering(false);
        setRenderedVideoUrl("rendered");
        setIsPlaying(true);
        setCurrentCaptionIdx(0);
        onNotify("UGC Video: Rendering completed successfully", "AUDIT");
      }
    }, 1000);
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Video className="w-5 h-5 text-[#8B5CF6]" />
            AI UGC Video Generation Dashboard
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Generate engaging avatar video clips from scripts, complete with custom presenters and captions.</p>
        </div>
        <span className="text-[10px] bg-[#7C3AED]/20 text-[#8B5CF6] border border-[#7C3AED]/30 px-2.5 py-1 rounded-full font-semibold">
          Agent-Media v2
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column Controls: Script, Styles, Presenter, Captions (8/12) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Script Input Console */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">Script-to-Video Console</label>
              <div className="flex gap-1.5">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl.text)}
                    className="text-[9px] bg-[#0B0B0F]/60 border border-white/[0.06] hover:border-[#8B5CF6]/40 text-[#A1A1AA] hover:text-white px-2 py-1 rounded-lg transition cursor-pointer"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Outline your video concept, or select a template above..."
                className="w-full h-32 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
              />
              <span className="absolute bottom-3 right-3 text-[9px] text-[#A1A1AA]/60 font-mono">
                {script.split(/\s+/).filter(Boolean).length} words | {script.length} chars
              </span>
            </div>
          </div>

          {/* Layout & Style Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Aspect Ratio */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "portrait", name: "Portrait (9:16)", icon: "Smartphone" },
                  { id: "square", name: "Square (1:1)", icon: "Square" },
                  { id: "landscape", name: "Cinematic (16:9)", icon: "Tv" }
                ].map((aspect) => {
                  const AspectIcon = Icons[aspect.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                  return (
                    <button
                      key={aspect.id}
                      onClick={() => setAspectRatio(aspect.id as "portrait" | "square" | "landscape")}
                      className={`px-3 py-2 rounded-xl text-[10px] font-semibold border flex flex-col items-center gap-1 transition cursor-pointer ${
                        aspectRatio === aspect.id
                          ? "bg-[#7C3AED]/20 text-white border-[#7C3AED]/40"
                          : "bg-[#0B0B0F]/65 border-white/[0.04] text-[#A1A1AA] hover:text-white"
                      }`}
                    >
                      {AspectIcon && <AspectIcon className="w-4 h-4" />}
                      <span>{aspect.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Style Preset */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block">Agent-Media Style Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStyle(st.id)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-semibold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      selectedStyle === st.id
                        ? "bg-[#7C3AED]/20 text-white border-[#7C3AED]/40"
                        : "bg-[#0B0B0F]/65 border-white/[0.04] text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${st.bg}`}></span>
                    <span>{st.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Presenter & Voice Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Presenter Selection */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block">AI Presenter / Avatar</label>
              <div className="grid grid-cols-2 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition cursor-pointer ${
                      selectedAvatar === av.id
                        ? "bg-[#7C3AED]/20 text-white border-[#7C3AED]/40"
                        : "bg-[#0B0B0F]/65 border-white/[0.04] text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${av.color} flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow`}>
                      {av.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-bold truncate leading-tight">{av.name}</h4>
                      <p className="text-[8px] text-[#A1A1AA] truncate leading-tight">{av.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Profile & Speed */}
            <div className="space-y-2.5 bg-[#0B0B0F]/30 border border-white/[0.04] p-3.5 rounded-xl">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">Voice Profile</label>
                <div className="flex gap-1">
                  {["Nova", "Echo", "Alloy"].map((vo) => (
                    <button
                      key={vo}
                      onClick={() => setVoiceProfile(vo)}
                      className={`px-2 py-0.5 rounded text-[8px] font-bold transition cursor-pointer ${
                        voiceProfile === vo ? "bg-[#8B5CF6] text-white" : "bg-white/[0.04] text-[#A1A1AA]"
                      }`}
                    >
                      {vo}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[8px] font-mono text-[#A1A1AA]">
                  <span>Speech Rate Trigger</span>
                  <span className="text-white font-bold">{voiceSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#121218] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                />
              </div>
            </div>
          </div>

          {/* Subtitles & Captions Controls */}
          <div className="bg-[#0B0B0F]/45 border border-white/[0.05] p-4 rounded-xl space-y-4">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Icons.Type className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Automated Caption & Overlays Font Controls</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[8px] uppercase text-[#A1A1AA] font-semibold tracking-wider block mb-1">Font Family</label>
                <select
                  value={captionFont}
                  onChange={(e) => setCaptionFont(e.target.value)}
                  className="w-full bg-[#121218] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="Inter">Inter (Sans)</option>
                  <option value="Outfit">Outfit (Round)</option>
                  <option value="Space-Grotesk">Space Grotesk</option>
                  <option value="Playfair-Display">Playfair Display</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] uppercase text-[#A1A1AA] font-semibold tracking-wider block mb-1">Overlay Size</label>
                <div className="flex bg-[#121218] border border-white/[0.08] rounded-lg p-0.5">
                  {(["sm", "md", "lg"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setCaptionSize(sz)}
                      className={`flex-1 text-[8px] font-bold py-1 uppercase rounded transition cursor-pointer ${
                        captionSize === sz ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[8px] uppercase text-[#A1A1AA] font-semibold tracking-wider block mb-1">Position</label>
                <select
                  value={captionPosition}
                  onChange={(e) => setCaptionPosition(e.target.value as "top" | "middle" | "bottom")}
                  className="w-full bg-[#121218] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="top">Top Header</option>
                  <option value="middle">Center Screen</option>
                  <option value="bottom">Bottom Overlay</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] uppercase text-[#A1A1AA] font-semibold tracking-wider block mb-1">Subtitle Style</label>
                <select
                  value={captionStyle}
                  onChange={(e) => setCaptionStyle(e.target.value as "karaoke" | "glow" | "classic")}
                  className="w-full bg-[#121218] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="karaoke">Karaoke Highlight</option>
                  <option value="glow">Neon Shadow Glow</option>
                  <option value="classic">Contrast Classic Box</option>
                </select>
              </div>
            </div>
          </div>

          {/* Render Action button */}
          <button
            onClick={handleRender}
            disabled={isRendering}
            className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-[#7C3AED]/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isRendering ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Rendering UGC Asset ({renderProgress}%)</span>
              </>
            ) : (
              <>
                <Icons.Sparkles className="w-4 h-4" />
                <span>Generate UGC Video Asset</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Asset Preview Player & Render Status Bar (5/12) */}
        <div className="xl:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Player Container */}
          <div className="flex-1 bg-[#0B0B0F] border border-white/[0.08] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden group shadow-inner">
            
            {/* Dynamic Aspect Ratio Box */}
            <div
              className={`border border-white/[0.08] bg-[#121218] shadow-2xl rounded-xl relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
                aspectRatio === "portrait"
                  ? "w-52 h-80"
                  : aspectRatio === "square"
                  ? "w-64 h-64"
                  : "w-80 h-48"
              }`}
            >
              {/* Playback Simulation */}
              {renderedVideoUrl ? (
                <div className="w-full h-full relative flex flex-col justify-between p-4 z-10">
                  {/* Speaker Avatar Simulation */}
                  <div className="absolute inset-0 flex items-center justify-center bg-radial from-[#121218] to-black">
                    {/* Pulsing Avatar Bubble */}
                    <div className="relative">
                      <motion.div
                        animate={isPlaying ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`w-20 h-20 rounded-full bg-gradient-to-tr ${
                          AVATARS.find(av => av.id === selectedAvatar)?.color || "from-purple-500 to-indigo-500"
                        } flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-purple-500/10 border-2 border-white/10`}
                      >
                        {selectedAvatar[0]}
                      </motion.div>
                      {/* Sub-speaker wave indicator */}
                      {isPlaying && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 flex items-center justify-center text-[7px] text-white">🔊</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Watermark Tag */}
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded border border-white/[0.05] text-[7px] text-[#A1A1AA] w-fit self-end font-mono">
                    <Icons.Sparkles className="w-2 h-2 text-[#8B5CF6]" />
                    <span>Agent-Media AI Generated</span>
                  </div>

                  {/* Subtitles Overlay */}
                  <div
                    className={`w-full z-20 text-center px-2 py-1 absolute left-0 right-0 ${
                      captionPosition === "top"
                        ? "top-4"
                        : captionPosition === "middle"
                        ? "top-1/2 -translate-y-1/2"
                        : "bottom-4"
                    }`}
                  >
                    {sentences.length > 0 && isPlaying && (
                      <div
                        className={`inline-block max-w-[90%] transition-all duration-200 ${
                          captionSize === "sm"
                            ? "text-[10px]"
                            : captionSize === "md"
                            ? "text-xs"
                            : "text-sm"
                        } ${
                          captionFont === "Space-Grotesk"
                            ? "font-mono font-bold tracking-tight"
                            : captionFont === "Playfair-Display"
                            ? "font-serif italic"
                            : "font-sans font-bold"
                        } ${
                          captionStyle === "glow"
                            ? "text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.9)]"
                            : captionStyle === "classic"
                            ? "bg-black text-white px-2 py-1 rounded border border-white/[0.1] shadow-lg"
                            : "text-[#8B5CF6] transition-colors"
                        }`}
                      >
                        {captionStyle === "karaoke" ? (
                          <span>
                            <span className="text-white bg-purple-600/30 px-1 py-0.5 rounded mr-1">
                              {sentences[currentCaptionIdx]?.split(" ").slice(0, 2).join(" ")}
                            </span>
                            {sentences[currentCaptionIdx]?.split(" ").slice(2).join(" ")}
                          </span>
                        ) : (
                          sentences[currentCaptionIdx]
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls HUD */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:text-[#8B5CF6] transition cursor-pointer"
                    >
                      {isPlaying ? <Icons.Pause className="w-3.5 h-3.5" /> : <Icons.Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setCurrentCaptionIdx(0)}
                      className="text-[#A1A1AA] hover:text-white transition cursor-pointer"
                    >
                      <Icons.RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2.5 z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#121218] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA]/50">
                    <Icons.Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-[#A1A1AA]">Asset Preview Console</h4>
                    <p className="text-[8px] text-[#A1A1AA]/60 mt-1 max-w-[140px] mx-auto">Render a video file on the left side to preview the presenter output.</p>
                  </div>
                </div>
              )}

              {/* Background style simulation shader */}
              <div className={`absolute inset-0 opacity-10 bg-gradient-to-tr ${
                STYLES.find(st => st.id === selectedStyle)?.bg || "from-purple-500 to-indigo-500"
              }`} />
            </div>

            {/* Direct video rendering status bar */}
            {isRendering && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#121218]/90 backdrop-blur-md border-t border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#8B5CF6] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse"></span>
                    {renderStep}
                  </span>
                  <span className="text-white font-mono font-bold">{renderProgress}%</span>
                </div>
                <div className="w-full bg-[#0B0B0F] h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${renderProgress}%` }}
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Settings Panel */}
          {renderedVideoUrl && (
            <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4 space-y-3.5 shadow-lg">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Asset Export Configurations</h4>
              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={() => {
                    onNotify("UGC Video: Exported asset to Local Media Library", "INFO");
                    alert("Video file successfully exported to your Advanced Media Library!");
                  }}
                  className="flex-1 bg-[#0B0B0F] hover:bg-white/[0.02] border border-white/[0.08] hover:border-[#8B5CF6]/30 text-white font-bold text-[10px] py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Icons.FolderPlus className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Send to Library</span>
                </button>
                
                <button
                  onClick={() => {
                    onNotify("UGC Video: Initiated download for synthesized mp4 stream", "INFO");
                    alert("Downloading generated MP4 video (HD 1080p)...");
                  }}
                  className="flex-1 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white font-bold text-[10px] py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow shadow-[#7C3AED]/20 cursor-pointer"
                >
                  <Icons.Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
