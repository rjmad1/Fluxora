"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

interface MediaItem {
  id: string;
  name: string;
  url: string;
}

interface MediaTransformerProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

const PRESET_ASSETS: MediaItem[] = [
  { id: "m-1", name: "telemetry_ingestion_chart.png", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80" },
  { id: "m-3", name: "brand_banner_purple.png", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80" },
  { id: "m-2", name: "office_meeting.jpg", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80" }
];

export default function MediaTransformer({ onNotify }: MediaTransformerProps) {
  const [selectedAsset, setSelectedAsset] = useState<MediaItem>(PRESET_ASSETS[0]);
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [textOverlay, setTextOverlay] = useState("");
  const [watermark, setWatermark] = useState<"none" | "purple" | "white">("none");
  const [watermarkOpacity, setWatermarkOpacity] = useState(60);
  const [watermarkPosition, setWatermarkPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("bottom-right");
  
  // Waveform state
  const [vocalFile, setVocalFile] = useState<string>("");
  const [vocalWaveformActive, setVocalWaveformActive] = useState(false);
  const [rendering, setRendering] = useState(false);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocalPoint({ x, y });
    onNotify(`Focal point coordinates updated: X:${x}%, Y:${y}%`, "INFO");
  };

  const handleRenderTransform = async () => {
    setRendering(true);
    const payload = {
      assetId: selectedAsset.id,
      name: selectedAsset.name,
      focalPoint,
      watermarkPreset: watermark !== "none" ? `${watermark}-${watermarkPosition}-${watermarkOpacity}%` : "None",
      textOverlay,
      audioWaveform: vocalWaveformActive,
      aspectRatios: [
        { ratio: "1:1", width: 1080, height: 1080, url: selectedAsset.url },
        { ratio: "9:16", width: 1080, height: 1920, url: selectedAsset.url },
        { ratio: "16:9", width: 1920, height: 1080, url: selectedAsset.url }
      ]
    };

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/media/transform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Offline");
      onNotify(`Multi-resolution assets generated successfully.`, "AUDIT");
      alert("Aspect ratio assets generated and persisted in workspace library!");
    } catch {
      onNotify(`Demo Mode: Aspect ratio assets generated and spooled locally`, "AUDIT");
      alert("Demo Mode: Multi-resolution assets simulated successfully!");
    } finally {
      setRendering(false);
    }
  };

  const getWatermarkPositionClass = (pos: string) => {
    switch (pos) {
      case "top-left": return "top-2 left-2";
      case "top-right": return "top-2 right-2";
      case "bottom-left": return "bottom-2 left-2";
      default: return "bottom-2 right-2";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icons.Video className="w-5 h-5 text-[#8B5CF6]" />
          Advanced Media Studio & Aspect-Ratio Transformer
        </h3>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Generate multi-resolution crops, set focal-point parameters to avoid framing breaks, and inject text overlays or audio waveforms.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Config Panel (5/12) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-5">
            {/* Asset Select */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#A1A1AA] block tracking-wide">Target Asset</label>
              <select
                value={selectedAsset.id}
                onChange={(e) => {
                  const asset = PRESET_ASSETS.find((a) => a.id === e.target.value);
                  if (asset) setSelectedAsset(asset);
                }}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
              >
                {PRESET_ASSETS.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Focal Point Selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#A1A1AA] block tracking-wide flex justify-between">
                <span>Interactive Focal-Point Crop Assistant</span>
                <span className="text-purple-400 font-mono font-bold">X:{focalPoint.x}% Y:{focalPoint.y}%</span>
              </label>
              <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
                Click anywhere on the image preview below to set the crop focus coordinates. All ratios will center here.
              </p>

              <div
                onClick={handleImageClick}
                className="relative h-44 bg-[#0B0B0F] rounded-xl overflow-hidden cursor-crosshair border border-white/[0.08] select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAsset.url}
                  alt="Focal point canvas selector"
                  className="w-full h-full object-cover pointer-events-none"
                />
                
                {/* Crosshair indicator */}
                <div
                  className="absolute w-6 h-6 border-2 border-dashed border-[#8B5CF6] rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
                >
                  <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full" />
                </div>
              </div>
            </div>

            {/* Dynamic Text Overlay */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#A1A1AA] block tracking-wide">Real-time Dynamic Text Overlay</label>
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="e.g. Telemetry Latency: <500ms ⚡"
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            {/* Watermark Settings */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-[#A1A1AA] block tracking-wide">Brand Preset Watermark</label>
              <div className="grid grid-cols-3 gap-2 bg-[#0B0B0F] p-1 border border-white/[0.08] rounded-xl">
                {(["none", "purple", "white"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWatermark(w)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold capitalize transition cursor-pointer ${
                      watermark === w ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>

              {watermark !== "none" && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#A1A1AA]">Opacity:</span>
                    <span className="text-white font-mono font-bold">{watermarkOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#0B0B0F] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                  />

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block">Watermark Placement</span>
                    <select
                      value={watermarkPosition}
                      onChange={(e) => setWatermarkPosition(e.target.value as any)}
                      className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Waveform generator */}
            <div className="space-y-2 bg-[#0B0B0F]/30 border border-white/[0.04] p-4 rounded-xl">
              <label className="text-[10px] uppercase font-bold text-[#A1A1AA] block tracking-wide">Audio Waveform Generator</label>
              <p className="text-[9px] text-[#A1A1AA] leading-relaxed">
                Provide a vocal clip file link or selector to convert audio tracks into social vertical explainer videos.
              </p>

              <select
                value={vocalFile}
                onChange={(e) => {
                  setVocalFile(e.target.value);
                  setVocalWaveformActive(!!e.target.value);
                  if (e.target.value) {
                    onNotify(`Loaded audio clip: ${e.target.value}`, "INFO");
                  }
                }}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="">No Audio Vocal Clip Linked</option>
                <option value="ceo_scaling_announcement.wav">ceo_scaling_announcement.wav (0:45s)</option>
                <option value="telemetry_deep_dive_voice.mp3">telemetry_deep_dive_voice.mp3 (1:15s)</option>
              </select>

              {vocalWaveformActive && (
                <div className="pt-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-mono text-purple-400 font-bold mb-2 animate-pulse">
                    🔊 Rendering Dynamic Audio Waveform Overlay
                  </span>
                  
                  {/* Bouncing SVG Waveform */}
                  <div className="flex items-center gap-0.5 h-10 w-full justify-center px-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((bar) => {
                      const randDelay = Math.random() * 0.8;
                      return (
                        <motion.div
                          key={bar}
                          animate={{ height: ["10%", "90%", "10%"] }}
                          transition={{ duration: 0.6 + Math.random() * 0.4, repeat: Infinity, delay: randDelay }}
                          className="w-1 bg-[#8B5CF6] rounded-full"
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleRenderTransform}
              disabled={rendering}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition cursor-pointer"
            >
              {rendering ? "Processing Crops & Overlays..." : "⚡ Render Multi-Resolution Transformations"}
            </button>
          </div>
        </div>

        {/* Right Multi-Resolution Aspect Ratio Grid (7/12) */}
        <div className="xl:col-span-7 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
              Multi-Resolution Generation Previews
            </h3>
            <p className="text-[11px] text-[#A1A1AA] mb-4">
              Inspect square, vertical story, and banner aspect ratio outputs. Dynamic text overlays and watermarks are injected proportionally.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Square Crop (1:1) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-white">Square (1:1 Ratio)</span>
                  <span className="font-mono text-[#A1A1AA]">1080 x 1080</span>
                </div>
                
                <div className="relative aspect-square w-full bg-[#0B0B0F] border border-white/[0.08] rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAsset.url}
                    alt="Square 1:1 Preview"
                    className="w-full h-full object-cover transition-all"
                    style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                  />

                  {/* Text Overlay */}
                  {textOverlay && (
                    <div className="absolute inset-x-2 bottom-6 bg-black/60 backdrop-blur-xs p-1.5 rounded text-[8px] text-center text-white font-bold leading-normal">
                      {textOverlay}
                    </div>
                  )}

                  {/* Watermark Logo */}
                  {watermark !== "none" && (
                    <span
                      className={`absolute ${getWatermarkPositionClass(watermarkPosition)} text-[8px] px-1.5 py-0.5 rounded font-mono font-bold`}
                      style={{
                        backgroundColor: watermark === "purple" ? `rgba(124, 58, 237, ${watermarkOpacity / 100})` : `rgba(255, 255, 255, ${watermarkOpacity / 100})`,
                        color: watermark === "purple" ? "#FFFFFF" : "#000000"
                      }}
                    >
                      Fluxora
                    </span>
                  )}
                </div>
              </div>

              {/* Vertical Story (9:16) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-white">Vertical (9:16 Ratio)</span>
                  <span className="font-mono text-[#A1A1AA]">1080 x 1920</span>
                </div>

                <div className="relative aspect-[9/16] w-full bg-[#0B0B0F] border border-white/[0.08] rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAsset.url}
                    alt="Vertical 9:16 Preview"
                    className="w-full h-full object-cover transition-all"
                    style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                  />

                  {/* Text Overlay */}
                  {textOverlay && (
                    <div className="absolute inset-x-2 bottom-8 bg-black/60 backdrop-blur-xs p-1.5 rounded text-[8px] text-center text-white font-bold leading-normal">
                      {textOverlay}
                    </div>
                  )}

                  {/* Watermark Logo */}
                  {watermark !== "none" && (
                    <span
                      className={`absolute ${getWatermarkPositionClass(watermarkPosition)} text-[8px] px-1.5 py-0.5 rounded font-mono font-bold`}
                      style={{
                        backgroundColor: watermark === "purple" ? `rgba(124, 58, 237, ${watermarkOpacity / 100})` : `rgba(255, 255, 255, ${watermarkOpacity / 100})`,
                        color: watermark === "purple" ? "#FFFFFF" : "#000000"
                      }}
                    >
                      Fluxora
                    </span>
                  )}
                </div>
              </div>

              {/* Landscape Banner (16:9) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-white">Landscape (16:9 Ratio)</span>
                  <span className="font-mono text-[#A1A1AA]">1920 x 1080</span>
                </div>

                <div className="relative aspect-[16/9] w-full bg-[#0B0B0F] border border-white/[0.08] rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAsset.url}
                    alt="Landscape 16:9 Preview"
                    className="w-full h-full object-cover transition-all"
                    style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
                  />

                  {/* Text Overlay */}
                  {textOverlay && (
                    <div className="absolute inset-x-2 bottom-3 bg-black/60 backdrop-blur-xs p-1 rounded text-[7px] text-center text-white font-bold leading-normal">
                      {textOverlay}
                    </div>
                  )}

                  {/* Watermark Logo */}
                  {watermark !== "none" && (
                    <span
                      className={`absolute ${getWatermarkPositionClass(watermarkPosition)} text-[7px] px-1 py-0.2 rounded font-mono font-bold`}
                      style={{
                        backgroundColor: watermark === "purple" ? `rgba(124, 58, 237, ${watermarkOpacity / 100})` : `rgba(255, 255, 255, ${watermarkOpacity / 100})`,
                        color: watermark === "purple" ? "#FFFFFF" : "#000000"
                      }}
                    >
                      Fluxora
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-3.5 text-[9px] text-[#A1A1AA] leading-relaxed">
            ℹ️ Focal-point cropping operates dynamically via CSS object positioning attributes. When downloading output binaries, they are compiled on S3 server instances using sharp buffers.
          </div>
        </div>

      </div>
    </div>
  );
}
