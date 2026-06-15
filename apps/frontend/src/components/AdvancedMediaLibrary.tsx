"use client";

import React, { useState, useEffect } from "react";
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
  campaign?: string;
  thumbnailTime?: number;
}

interface TaxonomyTag {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface AutoCollection {
  id: string;
  name: string;
  rules: string[];
  matchCount: number;
}

interface TopicWeight {
  category: string;
  weight: number;
}

const STOCK_RESULTS: MediaItem[] = [
  { id: "s-1", name: "Modern Analytics Dashboard Illustration", type: "Image", size: "1.2 MB", date: "Stock Vector", views: 0, url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", folder: "Banners", tags: ["vector", "analytics", "dashboard"], altText: "An abstract vector design showing a workspace with analytical charts and lines." },
  { id: "s-2", name: "Corporate Team Meeting Workshop", type: "Image", size: "2.4 MB", date: "Stock Photo", views: 0, url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80", folder: "Avatars", tags: ["photo", "team", "office"], altText: "A diverse group of developers sitting around a desk discussing high volume telemetry configurations." },
  { id: "s-3", name: "Digital Server Farm Connectivity", type: "Image", size: "3.5 MB", date: "Stock Photo", views: 0, url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80", folder: "Product Videos", tags: ["photo", "servers", "cloud"], altText: "Glowing network nodes and server stacks in an enterprise database data center." },
  { id: "s-4", name: "Minimalist Graph Ingestion Curves", type: "Image", size: "850 KB", date: "Stock Vector", views: 0, url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80", folder: "Infographics", tags: ["vector", "minimalist", "growth"], altText: "A smooth glowing pink and purple curve illustrating telemetry performance data over time." }
];

export default function AdvancedMediaLibrary({ onNotify }: AdvancedMediaLibraryProps) {
  const [activeTab, setActiveTab] = useState<"library" | "stock" | "taxonomy">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null);

  // Campaign Filter State
  const [campaignFilter, setCampaignFilter] = useState("All");

  // Bulk Edit States
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTagsInput, setBulkTagsInput] = useState("");
  const [bulkFolderInput, setBulkFolderInput] = useState("");

  // Taxonomy Tag and Weight States
  const [taxonomyTags, setTaxonomyTags] = useState<TaxonomyTag[]>([]);
  const [autoCollections, setAutoCollections] = useState<AutoCollection[]>([]);
  const [topicWeights, setTopicWeights] = useState<TopicWeight[]>([]);

  // Setup Tag Form States
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#8B5CF6");
  const [newTagDesc, setNewTagDesc] = useState("");
  
  // Setup Collection Form
  const [newColName, setNewColName] = useState("");
  const [newColRules, setNewColRules] = useState<string[]>([]);

  // Library Items
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([
    { id: "m-1", name: "telemetry_ingestion_chart.png", type: "Image", size: "2.4 MB", date: "2026-06-14", views: 4200, url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", folder: "Infographics", tags: ["clickhouse", "chart", "telemetry"], altText: "Line chart highlighting PostgreSQL vs ClickHouse telemetry sync times under high volumes.", campaign: "Scaling Launch v1" },
    { id: "m-2", name: "intro_explainer_v1.mp4", type: "Video", size: "45.1 MB", date: "2026-06-13", views: 12800, url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80", folder: "Product Videos", tags: ["explainer", "video", "intro"], altText: "Short cinematic clip showcasing the social media automation builder console.", campaign: "Platform Intro" },
    { id: "m-3", name: "brand_banner_purple.png", type: "Image", size: "1.8 MB", date: "2026-06-15", views: 980, url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80", folder: "Banners", tags: ["brand", "background", "artwork"], altText: "Abstract artwork with purple fluid aesthetics and neon glow rings.", campaign: "Scaling Launch v1" },
    { id: "m-4", name: "avatar_female_advocate.png", type: "Image", size: "1.1 MB", date: "2026-06-10", views: 150, url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=80", folder: "Avatars", tags: ["presenter", "face", "portrait"], altText: "Sophia the AI presenter, wearing formal attire, smiling towards the camera." }
  ]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const folders = ["All", "Banners", "Avatars", "Product Videos", "Infographics"];
  const allTags = Array.from(new Set(mediaItems.flatMap(item => item.tags)));
  const campaigns = ["All", "Scaling Launch v1", "Platform Intro"];

  // Fetch Taxonomy and Auto Collections
  const fetchTaxonomy = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/taxonomy/tags", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      setTaxonomyTags(data.tags || []);
      setAutoCollections(data.collections || []);
      setTopicWeights(data.weights || []);
    } catch {
      // Fallback
      setTaxonomyTags([
        { id: "tag-1", name: "clickhouse", color: "#8B5CF6", description: "Real-time database and analytics logs" },
        { id: "tag-2", name: "kafka", color: "#3B82F6", description: "Event stream pipelining" },
        { id: "tag-3", name: "security", color: "#10B981", description: "Keycloak tenant safety" },
        { id: "tag-4", name: "temporal", color: "#EF4444", description: "Background workers schedules" }
      ]);
      setAutoCollections([
        { id: "col-1", name: "Analytical Databases", rules: ["tag:clickhouse"], matchCount: 1 },
        { id: "col-2", name: "Streaming Infrastructure", rules: ["tag:kafka", "tag:temporal"], matchCount: 2 }
      ]);
      setTopicWeights([
        { category: "Technical Architectures", weight: 45 },
        { category: "Product Releases", weight: 35 },
        { category: "Hiring & Culture", weight: 20 }
      ]);
    }
  };

  useEffect(() => {
    fetchTaxonomy();
  }, []);

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

  // Create Tag Action
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const newTag = {
      name: newTagName.trim().toLowerCase(),
      color: newTagColor,
      description: newTagDesc.trim()
    };

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/taxonomy/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
        body: JSON.stringify(newTag),
      });
      const data = await res.json();
      setTaxonomyTags(prev => [...prev, data]);
      onNotify(`Taxonomy tag created: #${data.name}`, "AUDIT");
      setNewTagName("");
      setNewTagDesc("");
    } catch {
      // Fallback
      setTaxonomyTags(prev => [...prev, { id: `tag-${Date.now()}`, ...newTag }]);
      onNotify(`Demo Mode: Created taxonomy tag #${newTag.name}`, "AUDIT");
      setNewTagName("");
      setNewTagDesc("");
    }
  };

  // Topic Weights Save
  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/taxonomy/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
        body: JSON.stringify({ weights: topicWeights }),
      });
      const data = await res.json();
      setTopicWeights(data);
      onNotify("Topic target weights updated and synced.", "AUDIT");
    } catch {
      onNotify("Demo Mode: Topic weights updated locally", "AUDIT");
    }
  };

  const updateWeightValue = (category: string, val: number) => {
    setTopicWeights(prev => prev.map(w => w.category === category ? { ...w, weight: val } : w));
  };

  // Bulk metadata update
  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    const appendTags = bulkTagsInput.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

    try {
      await fetch("http://localhost:3000/api/v1/extended/media/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
        body: JSON.stringify({ assetIds: selectedIds, tags: appendTags }),
      });
      
      setMediaItems(prev => prev.map(item => {
        if (!selectedIds.includes(item.id)) return item;
        const mergedTags = Array.from(new Set([...item.tags, ...appendTags]));
        const updatedFolder = bulkFolderInput.trim() ? bulkFolderInput : item.folder;
        return { ...item, tags: mergedTags, folder: updatedFolder };
      }));

      onNotify(`Bulk updated tags/folder on ${selectedIds.length} assets.`, "AUDIT");
      setSelectedIds([]);
      setBulkMode(false);
      setBulkModalOpen(false);
      setBulkTagsInput("");
      setBulkFolderInput("");
    } catch {
      // Fallback
      setMediaItems(prev => prev.map(item => {
        if (!selectedIds.includes(item.id)) return item;
        const mergedTags = Array.from(new Set([...item.tags, ...appendTags]));
        const updatedFolder = bulkFolderInput.trim() ? bulkFolderInput : item.folder;
        return { ...item, tags: mergedTags, folder: updatedFolder };
      }));
      onNotify(`Demo Mode: Bulk updated tags on ${selectedIds.length} assets`, "AUDIT");
      setSelectedIds([]);
      setBulkMode(false);
      setBulkModalOpen(false);
      setBulkTagsInput("");
      setBulkFolderInput("");
    }
  };

  // Filter items
  const displayItems = activeTab === "library"
    ? mediaItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFolder = selectedFolder === "All" || item.folder === selectedFolder;
        const matchesTags = selectedTags.length === 0 || selectedTags.every(t => item.tags.includes(t));
        const matchesCampaign = campaignFilter === "All" || item.campaign === campaignFilter;
        return matchesSearch && matchesFolder && matchesTags && matchesCampaign;
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
          <p className="text-xs text-[#A1A1AA] mt-1">Centralized cloud-storage dashboard for dragging uploads, folders organizing, stock search, and custom tag rules.</p>
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
            <span>Stock Library</span>
          </button>
          <button
            onClick={() => { setActiveTab("taxonomy"); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "taxonomy" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <Icons.Tag className="w-3.5 h-3.5" />
            <span>Taxonomy & Weights</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab !== "taxonomy" ? (
          <motion.div
            key="library-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
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

              {/* Campaign Aggregator Filters */}
              {activeTab === "library" && (
                <div className="space-y-2.5">
                  <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider block">Campaign Aggregator</label>
                  <select
                    value={campaignFilter}
                    onChange={(e) => setCampaignFilter(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    {campaigns.map(c => (
                      <option key={c} value={c}>{c === "All" ? "All Campaigns" : c}</option>
                    ))}
                  </select>
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

              {/* Cloud Storage Panel */}
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
              {/* Controls */}
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1 bg-[#121218] border border-white/[0.08] rounded-xl px-3.5 py-2 flex items-center gap-2">
                    <Icons.Search className="w-4.5 h-4.5 text-[#A1A1AA]" />
                    <input
                      type="text"
                      placeholder={
                        activeTab === "library"
                          ? "Search workspace library by name or filter tags..."
                          : "Search integrated stock libraries..."
                      }
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-white text-xs focus:outline-none"
                    />
                  </div>

                  {/* Bulk Edit Toggle */}
                  {activeTab === "library" && (
                    <button
                      onClick={() => {
                        setBulkMode(!bulkMode);
                        setSelectedIds([]);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        bulkMode
                          ? "bg-[#EF4444] text-white"
                          : "bg-[#121218] hover:bg-white/[0.04] text-[#A1A1AA] hover:text-white border border-white/[0.08]"
                      }`}
                    >
                      <Icons.CheckSquare className="w-4 h-4" />
                      <span>{bulkMode ? "Cancel Bulk Mode" : "Bulk Edit Mode"}</span>
                    </button>
                  )}
                </div>

                {/* Bulk Actions Panel */}
                {bulkMode && selectedIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white">
                      Selected <span className="font-mono">{selectedIds.length}</span> assets for bulk modifications
                    </span>
                    <button
                      onClick={() => setBulkModalOpen(true)}
                      className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      ✏️ Edit Selected Metadata
                    </button>
                  </motion.div>
                )}

                {/* Drag & drop */}
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

              {/* Grid display */}
              {displayItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayItems.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (bulkMode) {
                            setSelectedIds(prev =>
                              isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                            );
                          }
                        }}
                        className={`bg-[#121218] border rounded-2xl overflow-hidden shadow-xl group transition duration-200 flex flex-col justify-between relative ${
                          bulkMode ? "cursor-pointer" : ""
                        } ${
                          isSelected ? "border-[#8B5CF6] ring-1 ring-[#8B5CF6]" : "border-white/[0.08] hover:border-[#8B5CF6]/30"
                        }`}
                      >
                        {/* Checkbox overlay in bulk mode */}
                        {bulkMode && (
                          <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 bg-[#0B0B0F]/80 rounded border border-white/[0.08] flex items-center justify-center">
                            {isSelected && <Icons.Check className="w-4 h-4 text-emerald-400" />}
                          </div>
                        )}

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

                          {/* Hover Overlay */}
                          {!bulkMode && activeTab === "library" && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                              <button
                                onClick={() => setSelectedAsset(item)}
                                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white p-2 rounded-xl transition cursor-pointer"
                              >
                                <Icons.Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setMediaItems(mediaItems.filter(i => i.id !== item.id));
                                  onNotify(`Media: Deleted file "${item.name}"`, "INFO");
                                }}
                                className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-xl transition cursor-pointer"
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

                          {item.campaign && (
                            <span className="inline-block text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 rounded font-bold font-mono">
                              📣 {item.campaign}
                            </span>
                          )}

                          {item.tags && (
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {item.tags.map(t => (
                                <span key={t} className="text-[8px] bg-white/[0.04] text-[#A1A1AA] px-1.5 py-0.2 rounded border border-white/[0.04]">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#0B0B0F]/30 border border-white/[0.05] rounded-2xl">
                  <Icons.Image className="w-8 h-8 text-[#A1A1AA]/40 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-[#A1A1AA]">No matching media assets</h4>
                  <p className="text-[9px] text-[#A1A1AA]/60 mt-1">Refine your search tags or upload files.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="taxonomy-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Taxonomy creation & collection list */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Custom Taxonomy Tag Creation (5/12) */}
              <div className="lg:col-span-5 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Icons.PlusSquare className="w-4.5 h-4.5 text-[#8B5CF6]" />
                  <span>Taxonomy Tag Creator</span>
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mb-4">
                  Define global taxonomy metadata tags with color-coding descriptions for content categorizing audits.
                </p>

                <form onSubmit={handleCreateTag} className="space-y-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Tag Name</label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="e.g. clickhouse"
                      className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2">
                      <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Color Palette</label>
                      <input
                        type="text"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Select Picker</label>
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-full h-8 bg-transparent cursor-pointer border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Description</label>
                    <input
                      type="text"
                      value={newTagDesc}
                      onChange={(e) => setNewTagDesc(e.target.value)}
                      placeholder="Explain what posts should utilize this tag..."
                      className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newTagName.trim()}
                    className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold py-2 rounded-xl transition mt-2"
                  >
                    🏷️ Create Taxonomy Tag
                  </button>
                </form>

                {/* Existing Tags Cloud */}
                <div className="mt-6 pt-5 border-t border-white/[0.04]">
                  <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block tracking-wide mb-3">Registered Taxonomy Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {taxonomyTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/[0.04]"
                        style={{ backgroundColor: `${tag.color}15` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span>#{tag.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Automated collection generator & Content Dials (7/12) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Automated collections */}
                <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Icons.FolderTree className="w-4.5 h-4.5 text-[#8B5CF6]" />
                    <span>Automated Smart Collections</span>
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA] mb-4">
                    Collections automatically populate matching rule criteria (e.g. tag matches, file types).
                  </p>

                  <div className="space-y-3">
                    {autoCollections.map((col) => (
                      <div key={col.id} className="p-3 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            <Icons.FolderHeart className="w-4 h-4 text-pink-500" />
                            {col.name}
                          </h4>
                          <div className="flex gap-1.5 mt-1.5">
                            {col.rules.map(rule => (
                              <span key={rule} className="text-[8px] bg-white/[0.04] text-[#A1A1AA] border border-white/[0.08] px-1.5 py-0.2 rounded font-mono">
                                {rule}
                              </span>
                            ))}
                          </div>
                        </div>

                        <span className="text-[10px] text-emerald-400 font-bold font-mono">
                          {col.matchCount} matched assets
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic Balance weight dials */}
                <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Icons.SlidersHorizontal className="w-4.5 h-4.5 text-[#8B5CF6]" />
                    <span>Content Category Weight Dials</span>
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA] mb-4">
                    Balance ratios to maintain balanced brand topic outputs. Target proportions will alert copy compilers.
                  </p>

                  <form onSubmit={handleSaveWeights} className="space-y-4">
                    <div className="space-y-3">
                      {topicWeights.map((w) => (
                        <div key={w.category} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-white">{w.category}</span>
                            <span className="font-mono text-purple-400 font-bold">{w.weight}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={w.weight}
                            onChange={(e) => updateWeightValue(w.category, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-[#0B0B0F] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      💾 Save Target Dials
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Metadata Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAsset(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5 z-10">
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Icons.Sliders className="w-4 h-4 text-[#8B5CF6]" /><span>Configure Asset Specifications</span></h3>
                <button onClick={() => setSelectedAsset(null)} className="p-1 hover:bg-white/[0.04] rounded text-[#A1A1AA] hover:text-white"><Icons.X className="w-4 h-4" /></button>
              </div>

              <div className="flex gap-4 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedAsset.url} alt={selectedAsset.altText} className="w-24 h-24 object-cover rounded-lg border border-white/[0.08] bg-[#0B0B0F]" />
                <div className="text-[11px] text-[#A1A1AA] space-y-1">
                  <h4 className="font-bold text-white truncate max-w-[280px]">{selectedAsset.name}</h4>
                  <p>Type: <span className="text-white font-bold">{selectedAsset.type}</span></p>
                  <p>Weight: <span className="text-white font-mono">{selectedAsset.size}</span></p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Alternative Text</label>
                <textarea value={selectedAsset.altText} onChange={e => setSelectedAsset({ ...selectedAsset, altText: e.target.value })} className="w-full h-16 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none" />
              </div>

              {selectedAsset.type === "Video" && (
                <div className="space-y-2.5 border-t border-white/[0.04] pt-4">
                  <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider flex justify-between">
                    <span>Timeline Preview Cover Frame</span>
                    <span className="text-white font-mono font-bold">{(selectedAsset.thumbnailTime || 0).toFixed(1)}s</span>
                  </label>
                  <input type="range" min="0" max="15" step="0.5" value={selectedAsset.thumbnailTime || 0} onChange={e => setSelectedAsset({ ...selectedAsset, thumbnailTime: parseFloat(e.target.value) })} className="w-full h-1.5 bg-[#0B0B0F] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]" />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.04]">
                <button onClick={() => setSelectedAsset(null)} className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] text-[10px] font-bold text-[#A1A1AA] rounded-xl transition">Cancel</button>
                <button onClick={handleUpdateAsset} className="px-5 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] text-[10px] font-bold text-white rounded-xl shadow-lg transition">Save Configurations</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {bulkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBulkModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4 z-10">
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Icons.Edit3 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Bulk Edit Metadata ({selectedIds.length} Assets)</span>
                </h3>
                <button onClick={() => setBulkModalOpen(false)} className="p-1 hover:bg-white/[0.04] rounded text-[#A1A1AA] hover:text-white"><Icons.X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleBulkUpdate} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#A1A1AA] block mb-1">Append Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={bulkTagsInput}
                    onChange={(e) => setBulkTagsInput(e.target.value)}
                    placeholder="e.g. clickhouse, bulk, launch"
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-[#A1A1AA] block mb-1">Move to Folder</label>
                  <select
                    value={bulkFolderInput}
                    onChange={(e) => setBulkFolderInput(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    <option value="">Do not move (Keep original)</option>
                    {folders.slice(1).map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.04]">
                  <button type="button" onClick={() => setBulkModalOpen(false)} className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] text-[10px] font-bold text-[#A1A1AA] rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] text-[10px] font-bold text-white rounded-xl shadow-lg transition">Apply Bulk Update</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
