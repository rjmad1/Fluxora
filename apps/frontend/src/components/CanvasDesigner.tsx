"use client";

import React, { useState, useRef } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

interface CanvasLayer {
  id: string;
  type: "text" | "image" | "shape";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  fontSize?: number;
  filter?: string;
}

interface CanvasPreset {
  name: string;
  ratio: string;
  width: number;
  height: number;
  icon: string;
}

const PRESETS: CanvasPreset[] = [
  { name: "Instagram Square (1:1)", ratio: "1:1", width: 400, height: 400, icon: "Square" },
  { name: "Stories / Reels (9:16)", ratio: "9:16", width: 280, height: 500, icon: "Smartphone" },
  { name: "Twitter / LI Banner (16:9)", ratio: "16:9", width: 500, height: 280, icon: "Tv" }
];

const ASSET_LIBRARY = [
  { id: "asset-1", name: "Fluxora Icon Logo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80", type: "logo" },
  { id: "asset-2", name: "Tech Banner Vector", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&q=80", type: "banner" },
  { id: "asset-3", name: "Team Headshot", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&q=80", type: "avatar" }
];

interface CanvasDesignerProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function CanvasDesigner({ onNotify }: CanvasDesignerProps) {
  const [activePreset, setActivePreset] = useState<CanvasPreset>(PRESETS[0]);
  const [layers, setLayers] = useState<CanvasLayer[]>([
    { id: "layer-bg", type: "shape", content: "bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950", x: 0, y: 0, width: 400, height: 400 },
    { id: "layer-txt-1", type: "text", content: "SCALING REAL-TIME AGGREGATIONS", x: 20, y: 50, width: 360, height: 40, color: "#8B5CF6", fontSize: 18 },
    { id: "layer-txt-2", type: "text", content: "How we hit <1.5s lag metrics sync across ClickHouse.", x: 20, y: 110, width: 360, height: 60, color: "#FFFFFF", fontSize: 14 }
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("layer-txt-1");
  const [aiImagePrompt, setAiImagePrompt] = useState("isometric data cloud pipelines, cyber purple nodes glowing network, detailed vector render");
  const [generatingAsset, setGeneratingAsset] = useState(false);

  // Drag states
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Add new text layer
  const addTextLayer = () => {
    const newId = `layer-txt-${Date.now()}`;
    setLayers(prev => [
      ...prev,
      { id: newId, type: "text", content: "Double-click to edit text", x: 80, y: 180, width: 240, height: 40, color: "#FFFFFF", fontSize: 14 }
    ]);
    setSelectedLayerId(newId);
    onNotify("Added text layer to canvas", "INFO");
  };

  // Add logo asset layer
  const addAssetToCanvas = (assetUrl: string, name: string) => {
    const newId = `layer-img-${Date.now()}`;
    setLayers(prev => [
      ...prev,
      { id: newId, type: "image", content: assetUrl, x: 140, y: 240, width: 120, height: 120, filter: "none" }
    ]);
    setSelectedLayerId(newId);
    onNotify(`Added graphic "${name}" to design`, "INFO");
  };

  // AI Image generator simulator
  const handleGenerateAIImage = () => {
    if (!aiImagePrompt.trim()) return;
    setGeneratingAsset(true);
    onNotify(`AI Generator: Rendering image for "${aiImagePrompt.slice(0, 30)}..."`, "INFO");

    setTimeout(() => {
      // Simulate generated image from Unsplash
      const stockUrls = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80"
      ];
      const randomUrl = stockUrls[Math.floor(Math.random() * stockUrls.length)];
      
      const newId = `layer-ai-${Date.now()}`;
      setLayers(prev => [
        ...prev,
        { id: newId, type: "image", content: randomUrl, x: 50, y: 50, width: 300, height: 300, filter: "brightness-105" }
      ]);
      setSelectedLayerId(newId);
      setGeneratingAsset(false);
      onNotify("AI Image asset successfully compiled on canvas", "INFO");
    }, 1500);
  };

  // Dragging interaction logic
  const handleLayerMouseDown = (e: React.MouseEvent, layer: CanvasLayer) => {
    e.stopPropagation();
    if (layer.id === "layer-bg") return; // Keep bg static
    setSelectedLayerId(layer.id);
    setIsDragging(true);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - layer.x;
      const clickY = e.clientY - rect.top - layer.y;
      setDragOffset({ x: clickX, y: clickY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedLayerId || !canvasRef.current) return;
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // Bounds constraint inside active template container size
    const clampedX = Math.max(0, Math.min(newX, activePreset.width - selectedLayer.width));
    const clampedY = Math.max(0, Math.min(newY, activePreset.height - selectedLayer.height));

    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: clampedX, y: clampedY } : l));
  };

  const handleLayerMouseUp = () => {
    setIsDragging(false);
  };

  const updateSelectedLayerField = (field: keyof CanvasLayer, value: any) => {
    if (!selectedLayerId) return;
    setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, [field]: value } : l));
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-start border-b border-white/[0.08] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Canva-like Design Editor</h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Design social media graphic cards and stories directly inside the command center.</p>
        </div>
        <Icons.Image className="w-5 h-5 text-[#8B5CF6]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Toolbar */}
        <div className="space-y-4">
          {/* Preset templates selector */}
          <div className="bg-[#0B0B0F]/60 border border-white/[0.08] p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Aspect Ratio Presets</h4>
            <div className="space-y-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setActivePreset(preset);
                    setLayers(prev => prev.map(l => {
                      if (l.id === "layer-bg") {
                        return { ...l, width: preset.width, height: preset.height };
                      }
                      return l;
                    }));
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activePreset.name === preset.name
                      ? "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-white"
                      : "bg-[#0B0B0F] border-white/[0.04] text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  <span>{preset.name}</span>
                  <span className="text-[10px] font-mono text-[#A1A1AA]">{preset.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Layer Actions */}
          <div className="flex gap-2">
            <button
              onClick={addTextLayer}
              className="flex-1 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Icons.Type className="w-3.5 h-3.5" />
              <span>Add Text</span>
            </button>
            <button
              onClick={() => updateSelectedLayerField("filter", "grayscale(1)")}
              className="flex-1 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Icons.Sliders className="w-3.5 h-3.5" />
              <span>Apply Filter</span>
            </button>
          </div>

          {/* Layer properties configuration */}
          {selectedLayer && (
            <div className="bg-[#0B0B0F]/60 border border-white/[0.08] p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Layer Controls</h4>
                <button
                  onClick={() => {
                    setLayers(prev => prev.filter(l => l.id !== selectedLayerId));
                    setSelectedLayerId(null);
                  }}
                  className="text-red-400 hover:text-red-300 text-[10px] cursor-pointer"
                >
                  Delete
                </button>
              </div>

              {selectedLayer.type === "text" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Text Content</label>
                    <input
                      type="text"
                      value={selectedLayer.content}
                      onChange={e => updateSelectedLayerField("content", e.target.value)}
                      className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-2 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Font Color</label>
                      <input
                        type="color"
                        value={selectedLayer.color || "#FFFFFF"}
                        onChange={e => updateSelectedLayerField("color", e.target.value)}
                        className="w-full h-8 bg-[#121218] border border-white/[0.08] rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Size (px)</label>
                      <input
                        type="number"
                        min="10"
                        max="72"
                        value={selectedLayer.fontSize || 14}
                        onChange={e => updateSelectedLayerField("fontSize", Number(e.target.value))}
                        className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-1 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedLayer.type === "image" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Filter Type</label>
                    <select
                      value={selectedLayer.filter || "none"}
                      onChange={e => updateSelectedLayerField("filter", e.target.value)}
                      className="w-full bg-[#121218] border border-white/[0.08] text-xs text-white p-1.5 rounded focus:outline-none cursor-pointer"
                    >
                      <option value="none">Normal</option>
                      <option value="grayscale(100%)">B&W (Grayscale)</option>
                      <option value="sepia(60%)">Warm (Sepia)</option>
                      <option value="blur(4px)">Background Blur</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] uppercase tracking-wider text-slate-500 block mb-1">Width (px)</label>
                      <input
                        type="range"
                        min="50"
                        max="400"
                        value={selectedLayer.width}
                        onChange={e => {
                          updateSelectedLayerField("width", Number(e.target.value));
                          updateSelectedLayerField("height", Number(e.target.value)); // square sizing sync
                        }}
                        className="w-full accent-[#7C3AED]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Middle Canvas Designer Space */}
        <div className="lg:col-span-2 flex justify-center items-center p-6 bg-[#0B0B0F]/60 border border-white/[0.08] border-dashed rounded-2xl relative min-h-[500px]">
          {/* Active Canvas Frame */}
          <div
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleLayerMouseUp}
            className="relative overflow-hidden bg-slate-900 shadow-2xl border border-white/[0.08] rounded-xl flex-shrink-0 transition-all select-none"
            style={{ width: activePreset.width, height: activePreset.height }}
          >
            {layers.map(layer => {
              const isSel = layer.id === selectedLayerId;
              if (layer.id === "layer-bg") {
                return (
                  <div
                    key={layer.id}
                    className={`absolute inset-0 w-full h-full bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950`}
                  />
                );
              }

              return (
                <div
                  key={layer.id}
                  onMouseDown={e => handleLayerMouseDown(e, layer)}
                  className={`absolute cursor-move select-none p-1 rounded ${
                    isSel ? "border-2 border-[#7C3AED] ring-2 ring-[#7C3AED]/20 bg-white/[0.02]" : "border border-transparent"
                  }`}
                  style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height
                  }}
                >
                  {layer.type === "text" ? (
                    <span
                      style={{
                        color: layer.color || "#FFFFFF",
                        fontSize: `${layer.fontSize}px`,
                        fontFamily: "Inter",
                        fontWeight: "bold",
                        lineHeight: 1.2
                      }}
                      className="block text-center select-none"
                    >
                      {layer.content}
                    </span>
                  ) : (
                    <img
                      src={layer.content}
                      alt="canvas node"
                      style={{ filter: layer.filter || "none" }}
                      className="w-full h-full object-cover rounded pointer-events-none select-none"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <span className="absolute bottom-3 text-[10px] text-[#A1A1AA]/50 font-mono">
            📏 Drag layers on canvas to edit layout. Aspect ratio: {activePreset.ratio}
          </span>
        </div>

        {/* Right Asset Drawer & AI Generator */}
        <div className="space-y-4">
          {/* AI Image Generation Console */}
          <div className="bg-[#0B0B0F]/60 border border-white/[0.08] p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Icons.Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>AI Graphic Generator</span>
            </h4>
            <div className="space-y-2">
              <textarea
                value={aiImagePrompt}
                onChange={e => setAiImagePrompt(e.target.value)}
                placeholder="Type descriptive prompt for text-to-image..."
                className="w-full h-16 bg-[#121218] border border-white/[0.08] text-[11px] text-white p-2.5 rounded-lg focus:outline-none resize-none"
              />
              <button
                onClick={handleGenerateAIImage}
                disabled={generatingAsset}
                className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-[10px] font-bold py-2 rounded-xl transition cursor-pointer"
              >
                {generatingAsset ? "Rendering AI Canvas layer..." : "⚡ Generate AI Image layer"}
              </button>
            </div>
          </div>

          {/* Graphics Library */}
          <div className="bg-[#0B0B0F]/60 border border-white/[0.08] p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Asset Library</h4>
            <div className="grid grid-cols-3 gap-2">
              {ASSET_LIBRARY.map(ass => (
                <button
                  key={ass.id}
                  onClick={() => addAssetToCanvas(ass.url, ass.name)}
                  className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED] p-1 rounded-lg overflow-hidden transition text-center cursor-pointer"
                  title="Click to place on canvas"
                >
                  <img src={ass.url} alt={ass.name} className="h-10 w-full object-cover rounded" />
                  <span className="text-[8px] text-[#A1A1AA] block truncate mt-0.5">{ass.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-[9px] text-[#A1A1AA]/60 font-mono">Click thumbnails to instantiate layer shapes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
