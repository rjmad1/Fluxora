"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdvancedMediaLibraryProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

interface MediaItem {
  id: string;
  name: string;
  type: "Image" | "Video";
  size: string;
  date: string;
  views: number;
  url: string;
  folder: string;
  tags: string[];
  altText: string;
  thumbnailTime?: number; // in seconds
}

const STOCK_RESULTS: MediaItem[] = [
  { id: "s-1", name: "Modern Analytics Dashboard Illustration", type: "Image", size: "1.2 MB", date: "Stock Vector", views: 0, url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", folder: "Banners", tags: ["vector", "analytics", "dashboard"], altText: "An abstract vector design showing a workspace with analytical charts and lines." },
  { id: "s-2", name: "Corporate Team Meeting Workshop", type: "Image", size: "2.4 MB", date: "Stock Photo", views: 0, url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80", folder: "Avatars", tags: ["photo", "team", "office"], altText: "A diverse group of developers sitting around a desk discussing high volume telemetry configurations." },
  { id: "s-3", name: "Digital Server Farm Connectivity", type: "Image", size: "3.5 MB", date: "Stock Photo", views: 0, url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80", folder: "Product Videos", tags: ["photo", "servers", "cloud"], altText: "Glowing network nodes and server stacks in an enterprise database data center." },
  { id: "s-4", name: "Minimalist Graph Ingestion Curves", type: "Image", size: "850 KB", date: "Stock Vector", views: 0, url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80", folder: "Infographics", tags: ["vector", "minimalist", "growth"], altText: "A smooth glowing pink and purple curve illustrating telemetry performance data over time." }
];

export default function AdvancedMediaLibrary({ onNotify }: AdvancedMediaLibraryProps) {
  const [activeTab, setActiveTab] = useState<"library" | "stock">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null);

  // Library Items
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([
    { id: "m-1", name: "telemetry_ingestion_chart.png", type: "Image", size: "2.4 MB", date: "2026-06-14", views: 4200, url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", folder: "Infographics", tags: ["clickhouse", "chart", "telemetry"], altText: "Line chart highlighting PostgreSQL vs ClickHouse telemetry sync times under high volumes." },
    { id: "m-2", name: "intro_explainer_v1.mp4", type: "Video", size: "45.1 MB", date: "2026-06-13", views: 12800, url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80", folder: "Product Videos", tags: ["explainer", "video", "intro"], altText: "Short cinematic clip showcasing the social media automation builder console.", thumbnailTime: 4.5 },
    { id: "m-3", name: "brand_banner_purple.png", type: "Image", size: "1.8 MB", date: "2026-06-15", views: 980, url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80", folder: "Banners", tags: ["brand", "background", "artwork"], altText: "Abstract artwork with purple fluid aesthetics and neon glow rings." },
    { id: "m-4", name: "avatar_female_advocate.png", type: "Image", size: "1.1 MB", date: "2026-06-10", views: 150, url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=80", folder: "Avatars", tags: ["presenter", "face", "portrait"], altText: "Sophia the AI presenter, wearing formal attire, smiling towards the camera." }
  ]);

  // Upload simulation
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const folders = ["All", "Banners", "Avatars", "Product Videos", "Infographics"];
  const allTags = Array.from(new Set(mediaItems.flatMap(item => item.tags)));

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0].name);
    }
  };

  const simulateUpload = (fileName: string) => {
    setUploadProgress(0);
    onNotify(`Media: Uploading asset "${fileName}"`, "INFO");

    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setUploadProgress(null);
            const isVideo = fileName.endsWith(".mp4") || fileName.endsWith(".mov");
            const newAsset: MediaItem = {
              id: `m-${Date.now()}`,
              name: fileName,
              type: isVideo ? "Video" : "Image",
              size: "2.1 MB",
              date: new Date().toISOString().slice(0, 10),
              views: 0,
              url: isVideo ? "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80" : "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=80",
              folder: isVideo ? "Product Videos" : "Banners",
              tags: ["uploaded", "new"],
              altText: `Uploaded media file: ${fileName}`
            };
            setMediaItems(prevItems => [newAsset, ...prevItems]);
            onNotify(`Media: Completed upload of "${fileName}"`, "AUDIT");
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const importStockAsset = (stockItem: typeof STOCK_RESULTS[0]) => {
    const newItem: MediaItem = {
      id: `m-${Date.now()}`,
      name: `stock_${stockItem.tags.join("_")}.png`,
      type: "Image",
      size: stockItem.size,
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      url: stockItem.url,
      folder: stockItem.folder,
      tags: [...stockItem.tags, "stock"],
      altText: stockItem.altText
    };
    setMediaItems([newItem, ...mediaItems]);
    onNotify(`Media: Imported stock asset to folder "${stockItem.folder}"`, "AUDIT");
    alert("Asset successfully imported from Stock Library!");
  };

  const handleUpdateAsset = () => {
    if (!selectedAsset) return;
    setMediaItems(prev => prev.map(item => {
      if (item.id !== selectedAsset.id) return item;
      onNotify(`Media: Updated metadata configurations for "${item.name}"`, "INFO");
      return selectedAsset;
    }));
    setSelectedAsset(null);
  };

  // Filter items
  const displayItems = activeTab === "library"
    ? mediaItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFolder = selectedFolder === "All" || item.folder === selectedFolder;
        const matchesTags = selectedTags.length === 0 || selectedTags.every(t => item.tags.includes(t));
        return matchesSearch && matchesFolder && matchesTags;
      })
    : STOCK_RESULTS.filter(item => {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      });

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.08] pb-4 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Image className="w-5 h-5 text-[#8B5CF6]" />
            Advanced Media Asset Library
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Centralized cloud-storage dashboard for dragging uploads, folders organizing, stock search, and alt-text tags.</p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#0B0B0F]/80 border border-white/[0.08] p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab("library"); setSearchQuery(""); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "library" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <Icons.HardDrive className="w-3.5 h-3.5" />
            <span>Workspace Library</span>
          </button>
          <button
            onClick={() => { setActiveTab("stock"); setSearchQuery(""); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "stock" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <Icons.Globe className="w-3.5 h-3.5" />
            <span>Stock Photos & Vectors</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Directory Folders & Tags Panel (3/12) */}
        <div className="xl:col-span-3 space-y-5">
          {/* Folders */}
          {activeTab === "library" && (
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block">Isolated Folder System</label>
              <div className="space-y-1">
                {folders.map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFolder(f)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                      selectedFolder === f
                        ? "text-white bg-[#7C3AED]/10 border border-[#7C3AED]/20 font-bold"
                        : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icons.Folder className={`w-4 h-4 ${selectedFolder === f ? "text-[#8B5CF6]" : "text-[#A1A1AA]/60"}`} />
                      <span>{f}</span>
                    </div>
                    <span className="text-[10px] text-[#A1A1AA]/50 font-mono">
                      {f === "All" ? mediaItems.length : mediaItems.filter(item => item.folder === f).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags cloud */}
          {activeTab === "library" && allTags.length > 0 && (
            <div className="space-y-2.5 bg-[#0B0B0F]/30 border border-white/[0.04] p-4 rounded-xl">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block">Multi-Tag Filters</label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-2.5 py-1 text-[9px] font-semibold rounded-full border transition cursor-pointer ${
                        isSelected
                          ? "bg-[#8B5CF6]/20 text-white border-[#8B5CF6]/50"
                          : "bg-[#121218] border-white/[0.04] text-[#A1A1AA] hover:text-white"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-[8px] text-[#A1A1AA] hover:text-white underline mt-1 block cursor-pointer"
                >
                  Clear all tag filters
                </button>
              )}
            </div>
          )}

          {/* Cloud Storage Panel details */}
          <div className="bg-[#121218] border border-white/[0.08] p-4 rounded-2xl shadow-inner space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Icons.Cloud className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Cloud Storage Hub</span>
            </h4>
            <div className="space-y-1 text-[10px] text-[#A1A1AA]">
              <div className="flex justify-between">
                <span>Usage Limit:</span>
                <span className="text-white font-mono font-bold">50.4 MB / 10 GB</span>
              </div>
              <div className="w-full bg-[#0B0B0F] h-1.5 rounded-full overflow-hidden border border-white/[0.04] mt-1.5">
                <div className="h-full bg-[#8B5CF6] w-[1%]" />
              </div>
            </div>
            <p className="text-[8px] text-[#A1A1AA]/50 font-mono">Workspace region: US-East sandbox bucket.</p>
          </div>
        </div>

        {/* Right Side: Upload and Asset Masonry Grid (9/12) */}
        <div className="xl:col-span-9 space-y-6">
          {/* Controls: Search + Drag & Drop Upload Zone */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 bg-[#121218] border border-white/[0.08] rounded-xl px-3.5 py-2 flex items-center gap-2">
                <Icons.Search className="w-4.5 h-4.5 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "library"
                      ? "Search workspace library by name or filter tags..."
                      : "Search integrated stock libraries (e.g. business, graphics, team)..."
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Drag & drop simulation */}
            {activeTab === "library" && (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition ${
                  dragActive ? "border-[#8B5CF6] bg-[#8B5CF6]/5" : "border-white/[0.08] hover:border-white/[0.15]"
                } relative`}
              >
                {uploadProgress !== null ? (
                  <div className="w-full max-w-xs space-y-2 text-center py-2">
                    <span className="text-[10px] text-white font-bold font-mono">Uploading Asset: {uploadProgress}%</span>
                    <div className="w-full bg-[#0B0B0F] h-1 rounded-full overflow-hidden border border-white/[0.04]">
                      <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6]" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 text-center cursor-pointer">
                    <Icons.UploadCloud className="w-7 h-7 text-[#A1A1AA]/60 group-hover:text-white" />
                    <div>
                      <h5 className="text-xs font-bold text-white">Drag & Drop files to upload</h5>
                      <p className="text-[9px] text-[#A1A1AA]/60 mt-0.5">Supports PNG, JPG, WebP, MP4 (Max 100MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          simulateUpload(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Display Grid */}
          {displayItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayItems.map(item => (
                <div
                  key={item.id}
                  className="bg-[#121218] border border-white/[0.08] hover:border-[#8B5CF6]/30 rounded-2xl overflow-hidden shadow-xl group transition duration-200 flex flex-col justify-between"
                >
                  <div className="h-36 bg-[#0B0B0F] relative overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.altText}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                    />
                    <span className="absolute top-2.5 left-2.5 text-[9px] bg-black/60 backdrop-blur-sm text-[#A1A1AA] border border-white/[0.08] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                      {item.type}
                    </span>
                    
                    {/* Overlay info / Hover actions */}
                    {activeTab === "library" && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => setSelectedAsset(item)}
                          className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white p-2 rounded-xl transition cursor-pointer"
                          title="Edit Alt Text & Covers"
                        >
                          <Icons.Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMediaItems(mediaItems.filter(i => i.id !== item.id));
                            onNotify(`Media: Deleted file "${item.name}"`, "INFO");
                          }}
                          className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-xl transition cursor-pointer"
                          title="Delete asset"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    
                    <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] font-mono">
                      <span>{item.size}</span>
                      <span>{item.date}</span>
                    </div>

                    {/* Tags */}
                    {item.tags && (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {item.tags.map(t => (
                          <span key={t} className="text-[8px] bg-white/[0.04] text-[#A1A1AA] px-1.5 py-0.2 rounded border border-white/[0.04]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Alt Text presence badge */}
                    {item.altText && (
                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[8px] text-[#A1A1AA]/60">
                        <span className="flex items-center gap-1">
                          <Icons.CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          Alt-Text Configured
                        </span>
                        {activeTab === "stock" && (
                          <button
                            onClick={() => importStockAsset(item)}
                            className="text-[#8B5CF6] hover:underline font-bold cursor-pointer"
                          >
                            Import to Lib
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#0B0B0F]/30 border border-white/[0.05] rounded-2xl">
              <Icons.Image className="w-8 h-8 text-[#A1A1AA]/40 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-[#A1A1AA]">No matching media assets</h4>
              <p className="text-[9px] text-[#A1A1AA]/60 mt-1">Refine your search tags or upload files into the library.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Edit Metadata Modal (Alt text & custom thumbnail selector) */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAsset(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5 z-10"
            >
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Icons.Sliders className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Configure Asset Specifications</span>
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 hover:bg-white/[0.04] rounded text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              {/* Asset Preview */}
              <div className="flex gap-4 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.altText}
                  className="w-24 h-24 object-cover rounded-lg border border-white/[0.08] bg-[#0B0B0F]"
                />
                <div className="text-[11px] text-[#A1A1AA] space-y-1">
                  <h4 className="font-bold text-white truncate max-w-[280px]">{selectedAsset.name}</h4>
                  <p>Type: <span className="text-white font-bold">{selectedAsset.type}</span></p>
                  <p>Dimensions: <span className="text-white font-mono">1920 x 1080</span></p>
                  <p>Weight: <span className="text-white font-mono">{selectedAsset.size}</span></p>
                </div>
              </div>

              {/* Alt text field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                  Alternative Text (Alt-text) for Accessibility
                </label>
                <textarea
                  value={selectedAsset.altText}
                  onChange={e => setSelectedAsset({ ...selectedAsset, altText: e.target.value })}
                  placeholder="Describe this image for screen readers and search SEO index engines..."
                  className="w-full h-16 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                />
                <p className="text-[8px] text-[#A1A1AA]/50 leading-relaxed">
                  Alt-text assists visually impaired users and builds native SEO weights on channels like LinkedIn.
                </p>
              </div>

              {/* Video cover thumbnail selection timeline */}
              {selectedAsset.type === "Video" && (
                <div className="space-y-2.5 border-t border-white/[0.04] pt-4">
                  <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex justify-between">
                    <span>Video Thumbnail selector timeline</span>
                    <span className="text-white font-mono font-bold">{(selectedAsset.thumbnailTime || 0).toFixed(1)}s</span>
                  </label>
                  
                  {/* Slider Timeline Simulation */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={selectedAsset.thumbnailTime || 0}
                      onChange={e => setSelectedAsset({ ...selectedAsset, thumbnailTime: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-[#0B0B0F] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-[#A1A1AA]/50 px-1">
                      <span>0.0s</span>
                      <span>5.0s</span>
                      <span>10.0s</span>
                      <span>15.0s (End)</span>
                    </div>
                  </div>
                  <p className="text-[8px] text-[#A1A1AA]/50">
                    Drag the slider to designate the custom preview cover frame used on LinkedIn/Facebook.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.04]">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] text-[10px] font-bold text-[#A1A1AA] rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAsset}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] text-[10px] font-bold text-white rounded-xl shadow-lg transition"
                >
                  Save Configurations
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
